<script setup lang="ts">
import { onMounted, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useServerStore } from '../stores/server'
import { useMessageStore } from '../stores/message'
import MessageList from '../components/MessageList.vue'
import MessageInput from '../components/MessageInput.vue'
import VoiceChannel from '../components/VoiceChannel.vue'

const route = useRoute()
const serverStore = useServerStore()
const messageStore = useMessageStore()

onMounted(() => {
  setupChannel()
})

const setupChannel = () => {
  const channelId = route.params.channelId as string
  if (channelId && serverStore.currentServer) {
    serverStore.selectChannel(channelId)
    if (serverStore.currentChannel?.type === 'text') {
      messageStore.subscribeToChannel(serverStore.currentServer.id, channelId)
    }
  }
}

watch(() => route.params.channelId, (channelId) => {
  if (channelId && serverStore.currentServer) {
    serverStore.selectChannel(channelId as string)
    if (serverStore.currentChannel?.type === 'text') {
      messageStore.subscribeToChannel(serverStore.currentServer.id, channelId as string)
    }
  }
})

// Re-setup when channels are loaded
watch(() => serverStore.channels, () => {
  if (!serverStore.currentChannel && route.params.channelId) {
    setupChannel()
  }
}, { deep: true })

onUnmounted(() => {
  messageStore.cleanup()
})
</script>

<template>
  <div class="channel-view" v-if="serverStore.currentChannel">
    <!-- Text Channel -->
    <template v-if="serverStore.currentChannel.type === 'text'">
      <div class="channel-header">
        <span class="hash">#</span>
        <span class="channel-name">{{ serverStore.currentChannel.name }}</span>
      </div>
      <MessageList />
      <MessageInput />
    </template>
    
    <!-- Voice Channel -->
    <template v-else>
      <VoiceChannel />
    </template>
  </div>
</template>

<style scoped>
.channel-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  overflow: hidden;
}

.channel-header {
  height: 48px;
  min-height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--bg-tertiary);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
}

.hash {
  color: var(--channel-icon);
  font-size: 24px;
  font-weight: 500;
}

.channel-name {
  font-weight: 600;
  font-size: 16px;
}
</style>
