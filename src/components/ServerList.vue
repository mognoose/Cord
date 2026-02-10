<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'
import CreateServerModal from './CreateServerModal.vue'

const router = useRouter()
const serverStore = useServerStore()

const showCreateModal = ref(false)

const selectServer = (serverId: string) => {
  router.push(`/app/server/${serverId}`)
}

const goHome = () => {
  router.push('/app')
}

const getServerInitial = (name: string) => {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
</script>

<template>
  <div class="server-list">
    <!-- Home Button -->
    <div class="server-item home" @click="goHome">
      <div class="server-icon home-icon">
        <svg viewBox="0 0 24 24" width="28" height="28">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      </div>
    </div>
    
    <div class="separator"></div>
    
    <!-- Server List -->
    <div 
      v-for="server in serverStore.servers" 
      :key="server.id"
      class="server-item"
      :class="{ active: serverStore.currentServer?.id === server.id }"
      @click="selectServer(server.id)"
    >
      <div class="server-icon" :title="server.name">
        <img v-if="server.iconUrl" :src="server.iconUrl" :alt="server.name" />
        <span v-else>{{ getServerInitial(server.name) }}</span>
      </div>
    </div>
    
    <!-- Add Server Button -->
    <div class="server-item add" @click="showCreateModal = true">
      <div class="server-icon add-icon">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </div>
    </div>
    
    <CreateServerModal v-if="showCreateModal" @close="showCreateModal = false" />
  </div>
</template>

<style scoped>
.server-list {
  width: 72px;
  min-width: 72px;
  background-color: var(--bg-tertiary);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 8px;
  overflow-y: auto;
}

.separator {
  width: 32px;
  height: 2px;
  background-color: var(--divider);
  border-radius: 1px;
}

.server-item {
  position: relative;
  cursor: pointer;
}

.server-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 0;
  background-color: var(--text-primary);
  border-radius: 0 4px 4px 0;
  transition: height 0.15s ease;
}

.server-item:hover::before {
  height: 20px;
}

.server-item.active::before {
  height: 40px;
}

.server-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: border-radius 0.15s ease, background-color 0.15s ease;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
}

.server-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.server-item:hover .server-icon,
.server-item.active .server-icon {
  border-radius: 16px;
}

.home-icon {
  background-color: var(--brand-primary);
  color: white;
}

.server-item.home:hover .home-icon {
  background-color: var(--brand-primary);
}

.add-icon {
  background-color: var(--bg-primary);
  color: var(--status-online);
}

.server-item.add:hover .add-icon {
  background-color: var(--status-online);
  color: white;
}
</style>
