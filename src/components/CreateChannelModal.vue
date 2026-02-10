<script setup lang="ts">
import { ref } from 'vue'
import { useServerStore } from '../stores/server'

const emit = defineEmits(['close'])
const serverStore = useServerStore()

const channelName = ref('')
const channelType = ref<'text' | 'voice'>('text')
const loading = ref(false)
const error = ref('')

const createChannel = async () => {
  if (!channelName.value.trim()) {
    error.value = 'Please enter a channel name'
    return
  }
  
  try {
    loading.value = true
    error.value = ''
    await serverStore.createNewChannel(channelName.value.toLowerCase().replace(/\s+/g, '-'), channelType.value)
    emit('close')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>Create Channel</h2>
        <button class="close-btn" @click="emit('close')">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="channel-type-selector">
          <label class="type-option" :class="{ active: channelType === 'text' }">
            <input type="radio" v-model="channelType" value="text" />
            <span class="type-icon">#</span>
            <div class="type-info">
              <span class="type-name">Text</span>
              <span class="type-desc">Send messages, images, GIFs, emoji, and more</span>
            </div>
          </label>
          
          <label class="type-option" :class="{ active: channelType === 'voice' }">
            <input type="radio" v-model="channelType" value="voice" />
            <svg class="type-icon" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <div class="type-info">
              <span class="type-name">Voice</span>
              <span class="type-desc">Hang out together with voice and screen share</span>
            </div>
          </label>
        </div>
        
        <div class="form-group">
          <label for="channelName">CHANNEL NAME</label>
          <div class="channel-input">
            <span class="input-prefix">{{ channelType === 'text' ? '#' : '🔊' }}</span>
            <input 
              id="channelName"
              v-model="channelName"
              type="text"
              placeholder="new-channel"
              :disabled="loading"
              @keyup.enter="createChannel"
            />
          </div>
        </div>
        
        <p v-if="error" class="error">{{ error }}</p>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-text" @click="emit('close')" :disabled="loading">
          Cancel
        </button>
        <button class="btn btn-primary" @click="createChannel" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create Channel' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--bg-secondary);
  border-radius: 5px;
  width: 100%;
  max-width: 460px;
}

.modal-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 0 16px 16px;
}

.channel-type-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: var(--bg-tertiary);
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
}

.type-option:hover {
  background-color: var(--bg-modifier-hover);
}

.type-option.active {
  border-color: var(--brand-primary);
}

.type-option input {
  display: none;
}

.type-icon {
  font-size: 24px;
  color: var(--channel-icon);
  width: 24px;
  text-align: center;
}

.type-info {
  display: flex;
  flex-direction: column;
}

.type-name {
  font-weight: 600;
}

.type-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.channel-input {
  display: flex;
  align-items: center;
  background-color: var(--bg-tertiary);
  border-radius: 3px;
}

.input-prefix {
  padding: 10px;
  color: var(--text-muted);
}

.channel-input input {
  flex: 1;
  padding-left: 0;
}

.error {
  color: var(--danger);
  font-size: 14px;
  margin-top: 8px;
}

.modal-footer {
  padding: 16px;
  background-color: var(--bg-tertiary);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-radius: 0 0 5px 5px;
}

.btn-text {
  background: none;
  color: var(--text-primary);
}

.btn-text:hover {
  text-decoration: underline;
}
</style>
