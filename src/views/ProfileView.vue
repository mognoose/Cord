<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { uploadAvatar } from '../firebase/storage'
import Avatar from '../components/Avatar.vue'

const authStore = useAuthStore()

const displayName = ref(authStore.profile?.displayName || '')
const bio = ref(authStore.profile?.bio || '')
const loading = ref(false)
const success = ref('')
const error = ref('')

const handleAvatarChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length || !authStore.user) return
  
  try {
    loading.value = true
    error.value = ''
    
    const file = input.files[0]
    const avatarUrl = await uploadAvatar(authStore.user.uid, file)
    await authStore.updateProfileData({ avatarUrl })
    
    success.value = 'Avatar updated!'
    setTimeout(() => success.value = '', 3000)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = ''
    
    await authStore.updateProfileData({
      displayName: displayName.value,
      bio: bio.value
    })
    
    success.value = 'Profile updated!'
    setTimeout(() => success.value = '', 3000)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="profile-view">
    <div class="profile-card">
      <h2>User Profile</h2>
      
      <div class="avatar-section">
        <Avatar 
          :url="authStore.profile?.avatarUrl" 
          :name="authStore.profile?.username || ''" 
          size="large"
        />
        <label class="avatar-upload">
          <input type="file" accept="image/*" @change="handleAvatarChange" :disabled="loading" />
          Change Avatar
        </label>
      </div>
      
      <form @submit.prevent="handleSubmit" class="profile-form">
        <div class="form-group">
          <label>USERNAME</label>
          <input :value="authStore.profile?.username" disabled />
          <span class="hint">Username cannot be changed</span>
        </div>
        
        <div class="form-group">
          <label>EMAIL</label>
          <input :value="authStore.profile?.email" disabled />
        </div>
        
        <div class="form-group">
          <label for="displayName">DISPLAY NAME</label>
          <input 
            id="displayName"
            v-model="displayName" 
            type="text"
            placeholder="How others see you"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="bio">ABOUT ME</label>
          <textarea 
            id="bio"
            v-model="bio" 
            placeholder="Tell us about yourself"
            rows="4"
            :disabled="loading"
          ></textarea>
        </div>
        
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>
        
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  flex: 1;
  padding: 40px;
  background-color: var(--bg-primary);
  overflow-y: auto;
}

.profile-card {
  max-width: 600px;
  margin: 0 auto;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 32px;
}

.profile-card h2 {
  margin-bottom: 24px;
  font-size: 20px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

.avatar-upload {
  padding: 8px 16px;
  background-color: var(--brand-primary);
  color: white;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.17s ease;
}

.avatar-upload:hover {
  background-color: var(--brand-hover);
}

.avatar-upload input {
  display: none;
}

.profile-form {
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

.form-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
}

.error {
  color: var(--danger);
  font-size: 14px;
  margin: 0;
}

.success {
  color: var(--status-online);
  font-size: 14px;
  margin: 0;
}

textarea {
  resize: vertical;
  min-height: 80px;
}
</style>
