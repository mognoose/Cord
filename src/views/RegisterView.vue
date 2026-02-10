<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  if (!email.value || !username.value || !password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  
  try {
    loading.value = true
    error.value = ''
    await authStore.register(email.value, password.value, username.value)
    router.push('/app')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>Create an account</h1>
      </div>
      
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="email">EMAIL</label>
          <input 
            id="email"
            v-model="email" 
            type="email" 
            required
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="username">USERNAME</label>
          <input 
            id="username"
            v-model="username" 
            type="text" 
            required
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="password">PASSWORD</label>
          <input 
            id="password"
            v-model="password" 
            type="password" 
            required
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">CONFIRM PASSWORD</label>
          <input 
            id="confirmPassword"
            v-model="confirmPassword" 
            type="password" 
            required
            :disabled="loading"
          />
        </div>
        
        <p v-if="error" class="error">{{ error }}</p>
        
        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Continue' }}
        </button>
        
        <p class="auth-footer">
          Already have an account? <router-link to="/login">Log In</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-tertiary);
}

.auth-card {
  background-color: var(--bg-secondary);
  padding: 32px;
  border-radius: 5px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.2);
}

.auth-header {
  text-align: center;
  margin-bottom: 20px;
}

.auth-header h1 {
  font-size: 24px;
  font-weight: 600;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.btn-full {
  width: 100%;
  margin-top: 10px;
}

.error {
  color: var(--danger);
  font-size: 14px;
  margin: 0;
}

.auth-footer {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}
</style>
