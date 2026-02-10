<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useServerStore } from '../stores/server'
import ServerList from '../components/ServerList.vue'
import UserPanel from '../components/UserPanel.vue'

const router = useRouter()
const authStore = useAuthStore()
const serverStore = useServerStore()

onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }
  
  await serverStore.fetchServers()
})

watch(() => authStore.user, (user) => {
  if (!user) {
    router.push('/login')
  }
})
</script>

<template>
  <div class="app-layout">
    <ServerList />
    <div class="main-content">
      <router-view />
    </div>
    <UserPanel />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
