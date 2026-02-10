<script setup lang="ts">
import { computed, watch, ref, onUnmounted } from 'vue'
import { useServerStore } from '../stores/server'
import { useVoiceStore } from '../stores/voice'
import Avatar from './Avatar.vue'

const serverStore = useServerStore()
const voiceStore = useVoiceStore()

const audioElements = ref<Map<string, HTMLAudioElement>>(new Map())

const isInChannel = computed(() => 
  voiceStore.currentVoiceChannel === serverStore.currentChannel?.id
)

const handleJoinLeave = () => {
  if (isInChannel.value) {
    voiceStore.leaveChannel()
  } else if (serverStore.currentChannel) {
    voiceStore.joinChannel(serverStore.currentChannel.id)
  }
}

// Watch for remote streams and play audio
watch(
  () => voiceStore.remoteStreams,
  (streams) => {
    console.log('Remote streams updated:', streams.size)
    
    // Create audio elements for new streams
    streams.forEach((stream, peerId) => {
      if (!audioElements.value.has(peerId)) {
        const audio = new Audio()
        audio.srcObject = stream
        audio.autoplay = true
        audio.setAttribute('playsinline', 'true')
        
        audio.play().catch(err => {
          console.error('Failed to play audio:', err)
        })
        
        audioElements.value.set(peerId, audio)
        console.log(`Created audio element for peer ${peerId}`)
      } else {
        // Update existing audio element if stream changed
        const audio = audioElements.value.get(peerId)!
        if (audio.srcObject !== stream) {
          audio.srcObject = stream
          audio.play().catch(err => {
            console.error('Failed to play updated audio:', err)
          })
        }
      }
    })
    
    // Remove audio elements for disconnected peers
    audioElements.value.forEach((audio, peerId) => {
      if (!streams.has(peerId)) {
        audio.pause()
        audio.srcObject = null
        audioElements.value.delete(peerId)
        console.log(`Removed audio element for peer ${peerId}`)
      }
    })
  },
  { deep: true, immediate: true }
)

// Cleanup on unmount
onUnmounted(() => {
  audioElements.value.forEach((audio) => {
    audio.pause()
    audio.srcObject = null
  })
  audioElements.value.clear()
})

// Custom directive for video srcObject
const vSrcObject = {
  mounted: (el: HTMLVideoElement, binding: { value: MediaStream | null }) => {
    if (binding.value) {
      el.srcObject = binding.value
    }
  },
  updated: (el: HTMLVideoElement, binding: { value: MediaStream | null }) => {
    if (el.srcObject !== binding.value) {
      el.srcObject = binding.value
    }
  }
}

// Get video stream for a peer (if they're screen sharing)
const getVideoStream = (peerId: string) => {
  const stream = voiceStore.remoteStreams.get(peerId)
  if (stream && stream.getVideoTracks().length > 0) {
    return stream
  }
  return null
}

// Check if any peer is streaming video (reactive to remoteStreams changes)
const streamingPeers = computed(() => {
  const peers: string[] = []
  const streams = voiceStore.remoteStreams
  if (streams.size > 0) {
    streams.forEach((stream, peerId) => {
      if (stream && stream.getVideoTracks().length > 0) {
        peers.push(peerId)
      }
    })
  }
  return peers
})

// Check if any user has streaming flag set (from presence)
const hasStreamingUser = computed(() => {
  return Object.values(voiceStore.connectedUsers).some((user: any) => user.streaming)
})
</script>

<template>
  <div class="voice-channel">
    <div class="voice-header">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
      <span class="channel-name">{{ serverStore.currentChannel?.name }}</span>
    </div>
    
    <div class="voice-content">
      <div v-if="!isInChannel" class="voice-join">
        <p>Join the voice channel to talk with others</p>
        <button class="btn btn-primary" @click="handleJoinLeave">
          Join Voice
        </button>
      </div>
      
      <div v-else class="voice-connected">
        <!-- Screen share display area -->
        <div v-if="streamingPeers.length > 0 || voiceStore.isStreaming" class="stream-area">
          <!-- Show own screen share preview -->
          <video 
            v-if="voiceStore.isStreaming && voiceStore.screenStream"
            v-src-object="voiceStore.screenStream"
            autoplay
            muted
            playsinline
            class="stream-video self"
          ></video>
          
          <!-- Show remote screen shares -->
          <video
            v-for="peerId in streamingPeers"
            :key="peerId"
            v-src-object="getVideoStream(peerId)"
            autoplay
            playsinline
            class="stream-video"
          ></video>
        </div>
        
        <div class="voice-users">
          <div 
            v-for="(user, odUserId) in voiceStore.connectedUsers" 
            :key="odUserId" 
            class="voice-user"
          >
            <Avatar 
              :url="user.avatarUrl" 
              :name="user.username" 
              size="large"
            />
            <span class="user-name">{{ user.username }}</span>
            <div class="user-indicators">
              <svg v-if="user.muted" viewBox="0 0 24 24" width="16" height="16" class="muted">
                <path fill="currentColor" d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
              </svg>
              <svg v-if="user.deafened" viewBox="0 0 24 24" width="16" height="16" class="deafened">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
              </svg>
              <span v-if="user.streaming" class="streaming-badge">LIVE</span>
            </div>
          </div>
        </div>
        
        <!-- Show message when someone is streaming but video not received yet -->
        <div v-if="hasStreamingUser && streamingPeers.length === 0 && !voiceStore.isStreaming" class="stream-notice">
          <span>📺 Someone is streaming - video should appear shortly...</span>
        </div>
        
        <div class="voice-controls">
          <button 
            class="control-btn" 
            :class="{ active: voiceStore.isMuted }"
            @click="voiceStore.toggleMute()"
            title="Toggle Mute"
          >
            <svg v-if="!voiceStore.isMuted" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
            </svg>
          </button>
          
          <button 
            class="control-btn" 
            :class="{ active: voiceStore.isDeafened }"
            @click="voiceStore.toggleDeafen()"
            title="Toggle Deafen"
          >
            <svg v-if="!voiceStore.isDeafened" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
            </svg>
          </button>
          
          <button 
            class="control-btn stream" 
            :class="{ active: voiceStore.isStreaming }"
            @click="voiceStore.isStreaming ? voiceStore.stopStreaming() : voiceStore.startStreaming()"
            title="Screen Share"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
            </svg>
          </button>
          
          <button 
            class="control-btn disconnect"
            @click="handleJoinLeave"
            title="Disconnect"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.voice-channel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
}

.voice-header {
  height: 48px;
  min-height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--bg-tertiary);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  color: var(--channel-icon);
}

.channel-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
}

.voice-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.voice-join {
  text-align: center;
}

.voice-join p {
  color: var(--text-muted);
  margin-bottom: 16px;
}

.voice-connected {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.stream-area {
  flex: 1;
  min-height: 200px;
  max-height: 60vh;
  display: flex;
  gap: 10px;
  padding: 20px;
  background-color: var(--bg-tertiary);
  border-radius: 8px;
  margin: 20px;
  margin-bottom: 0;
}

.stream-video {
  flex: 1;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  background-color: black;
  border-radius: 8px;
}

.stream-video.self {
  opacity: 0.8;
}

.voice-users {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.voice-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
}

.user-indicators {
  display: flex;
  gap: 4px;
  align-items: center;
}

.user-indicators svg {
  color: var(--danger);
}

.streaming-badge {
  background-color: var(--danger);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 3px;
}

.stream-notice {
  padding: 12px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

.voice-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 20px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
}

.control-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
}

.control-btn:hover {
  background-color: var(--bg-modifier-hover);
}

.control-btn.active {
  background-color: var(--danger);
  color: white;
}

.control-btn.stream.active {
  background-color: var(--brand-primary);
}

.control-btn.disconnect {
  background-color: var(--danger);
  color: white;
}

.control-btn.disconnect:hover {
  background-color: var(--danger-hover);
}
</style>
