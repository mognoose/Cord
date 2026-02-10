<script setup lang="ts">
import { useServerStore } from '../stores/server'

const serverStore = useServerStore()
</script>

<template>
  <div class="home-view">
    <div class="welcome-content">
      <div class="welcome-icon">
        <svg viewBox="0 0 100 100" width="80" height="80">
          <circle cx="50" cy="50" r="45" fill="#5865F2"/>
          <path d="M30 40 Q50 25 70 40 Q70 65 50 75 Q30 65 30 40" fill="white"/>
          <circle cx="40" cy="50" r="5" fill="#5865F2"/>
          <circle cx="60" cy="50" r="5" fill="#5865F2"/>
        </svg>
      </div>
      <h1>Welcome to Cord</h1>
      <p v-if="serverStore.servers.length === 0">
        You haven't joined any servers yet. Create or join a server to get started!
      </p>
      <p v-else>
        Select a server from the sidebar to start chatting.
      </p>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
}

.welcome-content {
  text-align: center;
  max-width: 400px;
  padding: 20px;
}

.welcome-icon {
  margin-bottom: 20px;
}

.welcome-content h1 {
  font-size: 28px;
  margin-bottom: 16px;
}

.welcome-content p {
  color: var(--text-secondary);
  line-height: 1.5;
}
</style>
