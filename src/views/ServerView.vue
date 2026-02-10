<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useServerStore } from '../stores/server'
import ChannelList from '../components/ChannelList.vue'

const route = useRoute()
const serverStore = useServerStore()

const hasChannelRoute = computed(() => !!route.params.channelId)

onMounted(async () => {
  const serverId = route.params.serverId as string
  if (serverId) {
    await serverStore.selectServer(serverId)
  }
})

watch(() => route.params.serverId, async (serverId) => {
  if (serverId) {
    await serverStore.selectServer(serverId as string)
  }
})
</script>

<template>
  <div class="server-view">
    <ChannelList v-if="serverStore.currentServer" />
    <div class="server-content">
      <router-view v-if="hasChannelRoute" />
      <div v-else class="no-channel">
        <p>Select a channel to start chatting</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.server-view {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.server-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.no-channel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
  color: var(--text-muted);
}
</style>
