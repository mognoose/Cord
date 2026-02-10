<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'

const emit = defineEmits(['close'])
const router = useRouter()
const serverStore = useServerStore()

const mode = ref<'choose' | 'create' | 'join'>('choose')
const serverName = ref('')
const inviteCode = ref('')
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

const joinServer = async () => {
  if (!inviteCode.value.trim()) {
    error.value = 'Please enter an invite code'
    return
  }
  
  try {
    loading.value = true
    error.value = ''
    const success = await serverStore.joinExistingServer(inviteCode.value.trim())
    if (success) {
      emit('close')
    } else {
      error.value = serverStore.error || 'Failed to join server'
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  mode.value = 'choose'
  error.value = ''
  serverName.value = ''
  inviteCode.value = ''
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <button class="close-btn" @click="emit('close')">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
      
      <!-- Choose Mode -->
      <template v-if="mode === 'choose'">
        <div class="modal-header">
          <h2>Add a Server</h2>
          <p>Create your own or join an existing one</p>
        </div>
        
        <div class="modal-body">
          <button class="option-btn" @click="mode = 'create'">
            <div class="option-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </div>
            <div class="option-text">
              <span class="option-title">Create My Own</span>
              <span class="option-desc">Create a new server and invite friends</span>
            </div>
            <svg viewBox="0 0 24 24" width="24" height="24" class="arrow">
              <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
          
          <button class="option-btn" @click="mode = 'join'">
            <div class="option-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div class="option-text">
              <span class="option-title">Join a Server</span>
              <span class="option-desc">Enter an invite code to join</span>
            </div>
            <svg viewBox="0 0 24 24" width="24" height="24" class="arrow">
              <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>
      </template>
      
      <!-- Create Server -->
      <template v-else-if="mode === 'create'">
        <div class="modal-header">
          <h2>Create a server</h2>
          <p>Your server is where you and your friends hang out.</p>
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
          <button class="btn btn-text" @click="goBack" :disabled="loading">
            Back
          </button>
          <button class="btn btn-primary" @click="createServer" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </template>
      
      <!-- Join Server -->
      <template v-else-if="mode === 'join'">
        <div class="modal-header">
          <h2>Join a Server</h2>
          <p>Enter an invite code to join an existing server</p>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="inviteCode">INVITE CODE</label>
            <input 
              id="inviteCode"
              v-model="inviteCode"
              type="text"
              placeholder="Enter invite code"
              :disabled="loading"
              @keyup.enter="joinServer"
            />
          </div>
          
          <p v-if="error" class="error">{{ error }}</p>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-text" @click="goBack" :disabled="loading">
            Back
          </button>
          <button class="btn btn-primary" @click="joinServer" :disabled="loading">
            {{ loading ? 'Joining...' : 'Join Server' }}
          </button>
        </div>
      </template>
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
  position: relative;
}

.modal-header {
  padding: 24px 24px 0;
  text-align: center;
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

.option-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--divider);
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  text-align: left;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.option-btn:hover {
  background-color: var(--bg-modifier-hover);
  border-color: var(--text-muted);
}

.option-icon {
  width: 48px;
  height: 48px;
  background-color: var(--brand-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-title {
  font-weight: 600;
  color: var(--text-primary);
}

.option-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.arrow {
  color: var(--text-muted);
  flex-shrink: 0;
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
