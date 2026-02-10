<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  url?: string
  name: string
  size?: 'small' | 'medium' | 'large'
  status?: 'online' | 'idle' | 'dnd' | 'offline'
}>()

const sizeClass = computed(() => `avatar-${props.size || 'medium'}`)

const initials = computed(() => {
  if (!props.name) return '?'
  return props.name.slice(0, 2).toUpperCase()
})

const backgroundColor = computed(() => {
  if (!props.name) return '#5865f2'
  const colors = ['#5865f2', '#3ba55c', '#faa61a', '#ed4245', '#9b59b6', '#e91e63']
  const index = props.name.charCodeAt(0) % colors.length
  return colors[index]
})
</script>

<template>
  <div class="avatar-wrapper">
    <div :class="['avatar', sizeClass]">
      <img v-if="url" :src="url" :alt="name" />
      <span v-else class="initials" :style="{ backgroundColor }">{{ initials }}</span>
    </div>
    <span v-if="status" :class="['status-indicator', status]"></span>
  </div>
</template>

<style scoped>
.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.avatar {
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.avatar-small {
  width: 24px;
  height: 24px;
  font-size: 10px;
}

.avatar-medium {
  width: 40px;
  height: 40px;
  font-size: 14px;
}

.avatar-large {
  width: 80px;
  height: 80px;
  font-size: 24px;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 3px solid var(--bg-secondary);
}

.status-indicator.online {
  background-color: var(--status-online);
}

.status-indicator.idle {
  background-color: var(--status-idle);
}

.status-indicator.dnd {
  background-color: var(--status-dnd);
}

.status-indicator.offline {
  background-color: var(--status-offline);
}
</style>
