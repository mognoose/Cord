<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'

const emit = defineEmits(['close'])
const router = useRouter()
const serverStore = useServerStore()

const serverName = ref('')
const loading = ref(false)
const error = ref('')

const createServer = async () => {
  if (!serverName.value.trim()) {
    error.value = 'Please enter a server name'
    return
  }
  
  try {
    loading.value = true
    error.value = ''
    const serverId = await serverStore.createNewServer(serverName.value)
    emit('close')
    if (serverId) {
      router.push(`/app/server/${serverId}`)
    }
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
        <h2>Create a server</h2>
        <p>Your server is where you and your friends hang out.</p>
        <button class="close-btn" @click="emit('close')">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="serverName">SERVER NAME</label>
          <input 
            id="serverName"
            v-model="serverName"
            type="text"
            placeholder="Enter server name"
            :disabled="loading"
            @keyup.enter="createServer"
          />
        </div>
        
        <p v-if="error" class="error">{{ error }}</p>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-text" @click="emit('close')" :disabled="loading">
          Back
        </button>
        <button class="btn btn-primary" @click="createServer" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create' }}
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
  max-width: 440px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.24);
}

.modal-header {
  padding: 24px 24px 0;
  text-align: center;
  position: relative;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.modal-header p {
  color: var(--text-secondary);
  font-size: 14px;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
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
  padding: 24px;
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

.error {
  color: var(--danger);
  font-size: 14px;
  margin-top: 8px;
}

.modal-footer {
  padding: 16px;
  background-color: var(--bg-tertiary);
  display: flex;
  justify-content: space-between;
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
