<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }
  
  try {
    loading.value = true
    error.value = ''
    await authStore.login(email.value, password.value)
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
        <h1>Welcome back!</h1>
        <p>We're so excited to see you again!</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="auth-form">
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
          <label for="password">PASSWORD</label>
          <input 
            id="password"
            v-model="password" 
            type="password" 
            required
            :disabled="loading"
          />
        </div>
        
        <p v-if="error" class="error">{{ error }}</p>
        
        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Log In' }}
        </button>
        
        <p class="auth-footer">
          Need an account? <router-link to="/register">Register</router-link>
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
  margin-bottom: 8px;
}

.auth-header p {
  color: var(--text-secondary);
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
