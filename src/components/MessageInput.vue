<script setup lang="ts">
import { ref } from 'vue'
import { useMessageStore } from '../stores/message'
import { useServerStore } from '../stores/server'

const messageStore = useMessageStore()
const serverStore = useServerStore()

const message = ref('')
const sending = ref(false)

const sendMessage = async () => {
  if (!message.value.trim() || sending.value) return
  
  try {
    sending.value = true
    await messageStore.sendNewMessage(message.value)
    message.value = ''
  } catch (e) {
    console.error('Failed to send message:', e)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="message-input-container">
    <form @submit.prevent="sendMessage" class="message-form">
      <button type="button" class="attach-btn" title="Upload file">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
        </svg>
      </button>
      
      <input 
        v-model="message"
        type="text"
        :placeholder="`Message #${serverStore.currentChannel?.name || 'channel'}`"
        :disabled="sending"
        @keyup.enter="sendMessage"
      />
      
      <div class="input-actions">
        <button type="button" class="emoji-btn" title="Emoji">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.message-input-container {
  padding: 0 16px 24px;
}

.message-form {
  display: flex;
  align-items: center;
  background-color: var(--bg-tertiary);
  border-radius: 8px;
  padding: 0 16px;
}

.attach-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.attach-btn:hover {
  color: var(--text-secondary);
}

input {
  flex: 1;
  background: none;
  border: none;
  padding: 11px 16px;
  font-size: 16px;
}

.input-actions {
  display: flex;
  gap: 8px;
}

.emoji-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-btn:hover {
  color: var(--text-secondary);
}
</style>
