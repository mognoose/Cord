import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  createServer, 
  getServer, 
  getUserServers, 
  joinServer, 
  leaveServer, 
  deleteServer,
  createChannel,
  subscribeToChannels,
  deleteChannel
} from '../firebase/firestore'
import { useAuthStore } from './auth'
import type { Server, Channel } from '../types'

export const useServerStore = defineStore('server', () => {
  const servers = ref<Server[]>([])
  const currentServer = ref<Server | null>(null)
  const channels = ref<Channel[]>([])
  const currentChannel = ref<Channel | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  let channelsUnsubscribe: (() => void) | null = null

  const textChannels = computed(() => 
    channels.value.filter(c => c.type === 'text')
  )
  
  const voiceChannels = computed(() => 
    channels.value.filter(c => c.type === 'voice')
  )

  const fetchServers = async () => {
    const authStore = useAuthStore()
    if (!authStore.user) return
    
    try {
      loading.value = true
      servers.value = await getUserServers(authStore.user.uid)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const selectServer = async (serverId: string) => {
    try {
      loading.value = true
      currentServer.value = await getServer(serverId)
      
      // Unsubscribe from previous channels
      if (channelsUnsubscribe) {
        channelsUnsubscribe()
      }
      
      // Subscribe to channels
      channelsUnsubscribe = subscribeToChannels(serverId, (updatedChannels) => {
        channels.value = updatedChannels
      })
      
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const selectChannel = (channelId: string) => {
    currentChannel.value = channels.value.find(c => c.id === channelId) || null
  }

  const createNewServer = async (name: string, iconUrl?: string) => {
    const authStore = useAuthStore()
    if (!authStore.user) return
    
    try {
      loading.value = true
      const serverId = await createServer({
        name,
        ...(iconUrl && { iconUrl }),
        ownerId: authStore.user.uid,
        members: [authStore.user.uid],
        inviteCode: generateInviteCode()
      })
      
      // Create default channels
      await createChannel(serverId, { name: 'general', type: 'text' })
      await createChannel(serverId, { name: 'General', type: 'voice' })
      
      await fetchServers()
      return serverId
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const joinExistingServer = async (inviteCode: string) => {
    const authStore = useAuthStore()
    if (!authStore.user) return
    
    // Find server by invite code
    const server = servers.value.find(s => s.inviteCode === inviteCode)
    if (server) {
      await joinServer(server.id, authStore.user.uid)
      await fetchServers()
    }
  }

  const leaveCurrentServer = async () => {
    const authStore = useAuthStore()
    if (!authStore.user || !currentServer.value) return
    
    await leaveServer(currentServer.value.id, authStore.user.uid)
    currentServer.value = null
    channels.value = []
    currentChannel.value = null
    await fetchServers()
  }

  const deleteCurrentServer = async () => {
    const authStore = useAuthStore()
    if (!authStore.user || !currentServer.value) return
    if (currentServer.value.ownerId !== authStore.user.uid) return
    
    await deleteServer(currentServer.value.id)
    currentServer.value = null
    channels.value = []
    currentChannel.value = null
    await fetchServers()
  }

  const createNewChannel = async (name: string, type: 'text' | 'voice') => {
    if (!currentServer.value) return
    
    try {
      await createChannel(currentServer.value.id, { name, type })
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  const deleteChannelById = async (channelId: string) => {
    if (!currentServer.value) return
    
    try {
      await deleteChannel(currentServer.value.id, channelId)
      if (currentChannel.value?.id === channelId) {
        currentChannel.value = null
      }
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  const cleanup = () => {
    if (channelsUnsubscribe) {
      channelsUnsubscribe()
      channelsUnsubscribe = null
    }
  }

  return {
    servers,
    currentServer,
    channels,
    currentChannel,
    textChannels,
    voiceChannels,
    loading,
    error,
    fetchServers,
    selectServer,
    selectChannel,
    createNewServer,
    joinExistingServer,
    leaveCurrentServer,
    deleteCurrentServer,
    createNewChannel,
    deleteChannelById,
    cleanup
  }
})

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
