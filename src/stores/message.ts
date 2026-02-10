import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  sendMessage, 
  subscribeToMessages, 
  deleteMessage 
} from '../firebase/firestore'
import { useAuthStore } from './auth'
import { useServerStore } from './server'
import type { Message } from '../types'

export const useMessageStore = defineStore('message', () => {
  const messages = ref<Message[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  let messagesUnsubscribe: (() => void) | null = null

  const subscribeToChannel = (serverId: string, channelId: string) => {
    // Unsubscribe from previous channel
    if (messagesUnsubscribe) {
      messagesUnsubscribe()
    }
    
    loading.value = true
    messagesUnsubscribe = subscribeToMessages(serverId, channelId, (updatedMessages) => {
      messages.value = updatedMessages
      loading.value = false
    })
  }

  const sendNewMessage = async (content: string) => {
    const authStore = useAuthStore()
    const serverStore = useServerStore()
    
    if (!authStore.user || !authStore.profile || !serverStore.currentServer || !serverStore.currentChannel) {
      return
    }
    
    try {
      await sendMessage(serverStore.currentServer.id, serverStore.currentChannel.id, {
        content,
        authorId: authStore.user.uid,
        authorName: authStore.profile.displayName || authStore.profile.username,
        ...(authStore.profile.avatarUrl && { authorAvatarUrl: authStore.profile.avatarUrl })
      })
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  const deleteMessageById = async (messageId: string) => {
    const serverStore = useServerStore()
    
    if (!serverStore.currentServer || !serverStore.currentChannel) {
      return
    }
    
    try {
      await deleteMessage(serverStore.currentServer.id, serverStore.currentChannel.id, messageId)
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  const cleanup = () => {
    if (messagesUnsubscribe) {
      messagesUnsubscribe()
      messagesUnsubscribe = null
    }
    messages.value = []
  }

  return {
    messages,
    loading,
    error,
    subscribeToChannel,
    sendNewMessage,
    deleteMessageById,
    cleanup
  }
})
