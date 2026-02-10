<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'
import { useVoiceStore } from '../stores/voice'
import { subscribeToVoiceChannel } from '../firebase/presence'
import CreateChannelModal from './CreateChannelModal.vue'

const router = useRouter()
const serverStore = useServerStore()
const voiceStore = useVoiceStore()

const showCreateModal = ref(false)
const showServerMenu = ref(false)
const copied = ref(false)

// Track users in ALL voice channels
const voiceChannelUsers = ref<Record<string, Record<string, any>>>({})
const unsubscribers = ref<(() => void)[]>([])

// Subscribe to voice presence for all voice channels when channels change
watch(
  () => [serverStore.currentServer?.id, serverStore.voiceChannels],
  () => {
    // Clean up old subscriptions
    unsubscribers.value.forEach(unsub => unsub())
    unsubscribers.value = []
    voiceChannelUsers.value = {}
    
    if (!serverStore.currentServer) return
    
    // Subscribe to each voice channel's presence
    for (const channel of serverStore.voiceChannels) {
      const unsub = subscribeToVoiceChannel(
        serverStore.currentServer.id,
        channel.id,
        (users) => {
          voiceChannelUsers.value[channel.id] = users
        }
      )
      unsubscribers.value.push(unsub)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  unsubscribers.value.forEach(unsub => unsub())
})

// Get users for a specific channel
const getChannelUsers = (channelId: string) => {
  return voiceChannelUsers.value[channelId] || {}
}

const selectChannel = (channelId: string) => {
  if (!serverStore.currentServer) return
  router.push(`/app/server/${serverStore.currentServer.id}/channel/${channelId}`)
}

const joinVoice = (channelId: string) => {
  selectChannel(channelId)
  voiceStore.joinChannel(channelId)
}

const copyInviteCode = () => {
  if (!serverStore.currentServer?.inviteCode) return
  navigator.clipboard.writeText(serverStore.currentServer.inviteCode)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
  showServerMenu.value = false
}
</script>

<template>
  <div class="channel-list" v-if="serverStore.currentServer">
    <div class="server-header" @click="showServerMenu = !showServerMenu">
      <h3>{{ serverStore.currentServer.name }}</h3>
      <svg viewBox="0 0 24 24" width="18" height="18" :class="{ rotated: showServerMenu }">
        <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
      </svg>
    </div>
    
    <!-- Server Menu Dropdown -->
    <div v-if="showServerMenu" class="server-menu">
      <button class="menu-item" @click="copyInviteCode">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        <span>{{ copied ? 'Copied!' : 'Copy Invite Code' }}</span>
      </button>
      <div class="invite-code" v-if="serverStore.currentServer.inviteCode">
        {{ serverStore.currentServer.inviteCode }}
      </div>
    </div>
    
    <div class="channels">
      <!-- Text Channels -->
      <div class="channel-category">
        <div class="category-header">
          <svg viewBox="0 0 24 24" width="12" height="12">
            <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
          <span>TEXT CHANNELS</span>
          <button class="add-btn" @click="showCreateModal = true" title="Create Channel">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>
        
        <div 
          v-for="channel in serverStore.textChannels" 
          :key="channel.id"
          class="channel-item"
          :class="{ active: serverStore.currentChannel?.id === channel.id }"
          @click="selectChannel(channel.id)"
        >
          <span class="channel-icon">#</span>
          <span class="channel-name">{{ channel.name }}</span>
        </div>
      </div>
      
      <!-- Voice Channels -->
      <div class="channel-category">
        <div class="category-header">
          <svg viewBox="0 0 24 24" width="12" height="12">
            <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
          <span>VOICE CHANNELS</span>
        </div>
        
        <div 
          v-for="channel in serverStore.voiceChannels" 
          :key="channel.id"
          class="channel-item voice"
          :class="{ active: voiceStore.currentVoiceChannel === channel.id }"
          @click="joinVoice(channel.id)"
        >
          <svg class="channel-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
          <span class="channel-name">{{ channel.name }}</span>
          
          <!-- Show connected users for this voice channel -->
          <div v-if="Object.keys(getChannelUsers(channel.id)).length > 0" class="voice-users">
            <div v-for="(user, odUserId) in getChannelUsers(channel.id)" :key="odUserId" class="voice-user">
              <span class="user-indicator" :class="{ speaking: !user.muted }"></span>
              <span class="user-name">{{ user.username }}</span>
              <span v-if="user.muted" class="user-muted">🔇</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <CreateChannelModal v-if="showCreateModal" @close="showCreateModal = false" />
  </div>
</template>

<style scoped>
.channel-list {
  width: 240px;
  min-width: 240px;
  background-color: var(--bg-secondary);
  display: flex;
  flex-direction: column;
}

.server-header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--bg-tertiary);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  cursor: pointer;
  justify-content: space-between;
}

.server-header:hover {
  background-color: var(--bg-modifier-hover);
}

.server-header svg {
  color: var(--text-muted);
  transition: transform 0.15s ease;
  flex-shrink: 0;
}

.server-header svg.rotated {
  transform: rotate(180deg);
}

.server-header h3 {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-menu {
  background-color: var(--bg-tertiary);
  padding: 8px;
  border-bottom: 1px solid var(--divider);
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.menu-item:hover {
  background-color: var(--brand-primary);
  color: white;
}

.invite-code {
  margin-top: 8px;
  padding: 8px;
  background-color: var(--bg-primary);
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  text-align: center;
  color: var(--text-primary);
  user-select: all;
}

.channels {
  flex: 1;
  overflow-y: auto;
  padding: 16px 8px;
}

.channel-category {
  margin-bottom: 16px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  cursor: pointer;
}

.category-header:hover {
  color: var(--text-secondary);
}

.add-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn:hover {
  color: var(--text-primary);
}

.channel-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-muted);
}

.channel-item:hover {
  background-color: var(--bg-modifier-hover);
  color: var(--text-secondary);
}

.channel-item.active {
  background-color: var(--bg-modifier-selected);
  color: var(--text-primary);
}

.channel-icon {
  color: var(--channel-icon);
  font-size: 20px;
  font-weight: 500;
}

.channel-item.voice .channel-icon {
  width: 20px;
  height: 20px;
}

.channel-name {
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.voice-users {
  width: 100%;
  padding-left: 26px;
  margin-top: 4px;
}

.voice-user {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.user-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--text-muted);
}

.user-indicator.speaking {
  background-color: var(--status-online);
}

.user-muted {
  font-size: 11px;
  opacity: 0.7;
}

.user-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
