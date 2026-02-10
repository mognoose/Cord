<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useMessageStore } from '../stores/message'
import { useAuthStore } from '../stores/auth'
import Avatar from './Avatar.vue'

const messageStore = useMessageStore()
const authStore = useAuthStore()

const messagesContainer = ref<HTMLElement | null>(null)

const formatTime = (timestamp: any) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const shouldShowDate = (currentMsg: any, prevMsg: any) => {
  if (!prevMsg) return true
  const currentDate = currentMsg.createdAt?.toDate?.() || new Date(currentMsg.createdAt)
  const prevDate = prevMsg.createdAt?.toDate?.() || new Date(prevMsg.createdAt)
  return currentDate.toDateString() !== prevDate.toDateString()
}

const shouldShowHeader = (currentMsg: any, prevMsg: any) => {
  if (!prevMsg) return true
  if (currentMsg.authorId !== prevMsg.authorId) return true
  const currentTime = currentMsg.createdAt?.toDate?.() || new Date(currentMsg.createdAt)
  const prevTime = prevMsg.createdAt?.toDate?.() || new Date(prevMsg.createdAt)
  return (currentTime.getTime() - prevTime.getTime()) > 5 * 60 * 1000 // 5 minutes
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(() => messageStore.messages.length, () => {
  scrollToBottom()
})

const handleDelete = (messageId: string) => {
  messageStore.deleteMessageById(messageId)
}
</script>

<template>
  <div class="message-list" ref="messagesContainer">
    <div class="messages-inner">
      <template v-for="(message, index) in messageStore.messages" :key="message.id">
        <!-- Date separator -->
        <div v-if="shouldShowDate(message, messageStore.messages[index - 1])" class="date-separator">
          <span>{{ formatDate(message.createdAt) }}</span>
        </div>
        
        <!-- Message -->
        <div class="message" :class="{ 'compact': !shouldShowHeader(message, messageStore.messages[index - 1]) }">
          <template v-if="shouldShowHeader(message, messageStore.messages[index - 1])">
            <Avatar 
              :url="message.authorAvatarUrl" 
              :name="message.authorName" 
              size="medium"
            />
            <div class="message-content">
              <div class="message-header">
                <span class="author-name">{{ message.authorName }}</span>
                <span class="timestamp">{{ formatTime(message.createdAt) }}</span>
              </div>
              <div class="message-text">{{ message.content }}</div>
            </div>
          </template>
          <template v-else>
            <span class="compact-timestamp">{{ formatTime(message.createdAt) }}</span>
            <div class="message-text">{{ message.content }}</div>
          </template>
          
          <!-- Actions (only for own messages) -->
          <div v-if="message.authorId === authStore.user?.uid" class="message-actions">
            <button @click="handleDelete(message.id)" class="action-btn" title="Delete">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        </div>
      </template>
      
      <div v-if="messageStore.messages.length === 0 && !messageStore.loading" class="no-messages">
        <p>No messages yet. Start the conversation!</p>
      </div>
      
      <div v-if="messageStore.loading" class="loading">
        <p>Loading messages...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.messages-inner {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  justify-content: flex-end;
}

.date-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
}

.date-separator span {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background-color: var(--bg-primary);
  padding: 0 8px;
  position: relative;
}

.date-separator::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  height: 1px;
  background-color: var(--divider);
  top: 50%;
}

.date-separator span {
  position: relative;
  z-index: 1;
}

.message {
  display: flex;
  gap: 16px;
  padding: 2px 16px;
  position: relative;
}

.message:hover {
  background-color: var(--bg-modifier-hover);
}

.message:not(.compact) {
  padding-top: 16px;
}

.message.compact {
  padding-left: 72px;
}

.compact-timestamp {
  position: absolute;
  left: 16px;
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0;
  min-width: 40px;
  text-align: right;
}

.message.compact:hover .compact-timestamp {
  opacity: 1;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}

.author-name {
  font-weight: 600;
  font-size: 16px;
}

.author-name:hover {
  text-decoration: underline;
  cursor: pointer;
}

.timestamp {
  font-size: 12px;
  color: var(--text-muted);
}

.message-text {
  color: var(--text-secondary);
  line-height: 1.375;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message-actions {
  position: absolute;
  right: 16px;
  top: 0;
  transform: translateY(-50%);
  display: none;
  background-color: var(--bg-secondary);
  border-radius: 4px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
}

.message:hover .message-actions {
  display: flex;
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  color: var(--danger);
}

.no-messages,
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-muted);
}
</style>
