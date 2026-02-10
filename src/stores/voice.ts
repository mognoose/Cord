import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { 
  joinVoiceChannel, 
  leaveVoiceChannel, 
  updateVoiceState,
  subscribeToVoiceChannel 
} from '../firebase/presence'
import { sendSignal, subscribeToSignaling, type SignalingMessage } from '../firebase/signaling'
import { useAuthStore } from './auth'
import { useServerStore } from './server'

interface PeerConnection {
  peerId: string
  connection: RTCPeerConnection
  audioStream?: MediaStream
  videoStream?: MediaStream
  pendingCandidates: RTCIceCandidateInit[]
}

export const useVoiceStore = defineStore('voice', () => {
  const isConnected = ref(false)
  const isMuted = ref(false)
  const isDeafened = ref(false)
  const isStreaming = ref(false)
  const currentVoiceChannel = ref<string | null>(null)
  const connectedUsers = ref<Record<string, any>>({})
  
  const localStream = shallowRef<MediaStream | null>(null)
  const screenStream = shallowRef<MediaStream | null>(null)
  const peerConnections = ref<Map<string, PeerConnection>>(new Map())
  const remoteStreams = ref<Map<string, MediaStream>>(new Map())
  
  let voiceUnsubscribe: (() => void) | null = null
  let signalingUnsubscribe: (() => void) | null = null

  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    // Free TURN servers for NAT traversal (consider setting up your own for production)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]

  const joinChannel = async (channelId: string) => {
    const authStore = useAuthStore()
    const serverStore = useServerStore()
    
    if (!authStore.user || !authStore.profile || !serverStore.currentServer) return
    
    try {
      // Get audio stream
      localStream.value = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      })
      
      currentVoiceChannel.value = channelId
      isConnected.value = true
      
      // Join presence
      joinVoiceChannel(
        serverStore.currentServer.id, 
        channelId, 
        authStore.user.uid,
        {
          username: authStore.profile.displayName || authStore.profile.username,
          avatarUrl: authStore.profile.avatarUrl
        }
      )
      
      // Subscribe to voice channel users
      voiceUnsubscribe = subscribeToVoiceChannel(
        serverStore.currentServer.id,
        channelId,
        async (users) => {
          connectedUsers.value = users
          
          // Setup peer connections for new users
          for (const [peerId] of Object.entries(users)) {
            if (peerId !== authStore.user!.uid && !peerConnections.value.has(peerId)) {
              await createPeerConnection(peerId)
            }
          }
          
          // Remove peer connections for users who left
          for (const peerId of peerConnections.value.keys()) {
            if (!users[peerId]) {
              closePeerConnection(peerId)
            }
          }
        }
      )
      
      // Subscribe to signaling
      signalingUnsubscribe = subscribeToSignaling(
        serverStore.currentServer.id,
        channelId,
        authStore.user.uid,
        handleSignalingMessage
      )
      
    } catch (e: any) {
      console.error('Failed to join voice channel:', e)
      throw e
    }
  }

  const leaveChannel = () => {
    const authStore = useAuthStore()
    const serverStore = useServerStore()
    
    if (!authStore.user || !serverStore.currentServer || !currentVoiceChannel.value) return
    
    // Leave presence
    leaveVoiceChannel(serverStore.currentServer.id, currentVoiceChannel.value, authStore.user.uid)
    
    // Stop local stream
    if (localStream.value) {
      localStream.value.getTracks().forEach(track => track.stop())
      localStream.value = null
    }
    
    // Stop screen stream
    if (screenStream.value) {
      screenStream.value.getTracks().forEach(track => track.stop())
      screenStream.value = null
    }
    
    // Close all peer connections
    peerConnections.value.forEach((_, peerId) => closePeerConnection(peerId))
    peerConnections.value.clear()
    remoteStreams.value.clear()
    
    // Unsubscribe
    if (voiceUnsubscribe) {
      voiceUnsubscribe()
      voiceUnsubscribe = null
    }
    if (signalingUnsubscribe) {
      signalingUnsubscribe()
      signalingUnsubscribe = null
    }
    
    currentVoiceChannel.value = null
    isConnected.value = false
    isMuted.value = false
    isDeafened.value = false
    isStreaming.value = false
    connectedUsers.value = {}
  }

  const toggleMute = () => {
    const authStore = useAuthStore()
    const serverStore = useServerStore()
    
    if (!localStream.value || !authStore.user || !serverStore.currentServer || !currentVoiceChannel.value) return
    
    isMuted.value = !isMuted.value
    localStream.value.getAudioTracks().forEach(track => {
      track.enabled = !isMuted.value
    })
    
    updateVoiceState(serverStore.currentServer.id, currentVoiceChannel.value, authStore.user.uid, {
      muted: isMuted.value
    })
  }

  const toggleDeafen = () => {
    const authStore = useAuthStore()
    const serverStore = useServerStore()
    
    if (!authStore.user || !serverStore.currentServer || !currentVoiceChannel.value) return
    
    isDeafened.value = !isDeafened.value
    
    // Mute all remote audio
    remoteStreams.value.forEach(stream => {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isDeafened.value
      })
    })
    
    updateVoiceState(serverStore.currentServer.id, currentVoiceChannel.value, authStore.user.uid, {
      deafened: isDeafened.value
    })
  }

  const startStreaming = async () => {
    const authStore = useAuthStore()
    const serverStore = useServerStore()
    
    if (!authStore.user || !serverStore.currentServer || !currentVoiceChannel.value) return
    
    try {
      screenStream.value = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })
      
      isStreaming.value = true
      
      updateVoiceState(serverStore.currentServer.id, currentVoiceChannel.value, authStore.user.uid, {
        streaming: true
      })
      
      // Add screen tracks to peer connections and renegotiate
      for (const [peerId, { connection }] of peerConnections.value) {
        screenStream.value!.getTracks().forEach(track => {
          connection.addTrack(track, screenStream.value!)
        })
        
        // Renegotiate connection after adding tracks
        if (authStore.user!.uid < peerId) {
          const offer = await connection.createOffer()
          await connection.setLocalDescription(offer)
          sendSignal(serverStore.currentServer!.id, currentVoiceChannel.value!, {
            type: 'offer',
            from: authStore.user!.uid,
            to: peerId,
            payload: offer
          })
        }
      }
      
      // Handle stream end
      screenStream.value.getVideoTracks()[0].onended = () => {
        stopStreaming()
      }
      
    } catch (e: any) {
      console.error('Failed to start streaming:', e)
    }
  }

  const stopStreaming = () => {
    const authStore = useAuthStore()
    const serverStore = useServerStore()
    
    if (!authStore.user || !serverStore.currentServer || !currentVoiceChannel.value) return
    
    if (screenStream.value) {
      screenStream.value.getTracks().forEach(track => track.stop())
      screenStream.value = null
    }
    
    isStreaming.value = false
    
    updateVoiceState(serverStore.currentServer.id, currentVoiceChannel.value, authStore.user.uid, {
      streaming: false
    })
  }

  const createPeerConnection = async (peerId: string) => {
    const authStore = useAuthStore()
    const serverStore = useServerStore()
    
    if (!authStore.user || !serverStore.currentServer || !currentVoiceChannel.value) return
    
    const connection = new RTCPeerConnection({ iceServers })
    
    // Add local tracks
    if (localStream.value) {
      localStream.value.getTracks().forEach(track => {
        connection.addTrack(track, localStream.value!)
      })
    }
    
    // Log connection state for debugging
    connection.onconnectionstatechange = () => {
      console.log(`Peer ${peerId} connection state:`, connection.connectionState)
    }
    
    connection.oniceconnectionstatechange = () => {
      console.log(`Peer ${peerId} ICE state:`, connection.iceConnectionState)
    }

    // Handle ICE candidates
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(serverStore.currentServer!.id, currentVoiceChannel.value!, {
          type: 'ice-candidate',
          from: authStore.user!.uid,
          to: peerId,
          payload: event.candidate.toJSON()
        })
      }
    }
    
    // Handle remote tracks
    connection.ontrack = (event) => {
      console.log(`Received track from ${peerId}:`, event.track.kind)
      let stream = remoteStreams.value.get(peerId)
      if (!stream) {
        stream = new MediaStream()
        remoteStreams.value.set(peerId, stream)
        // Force reactivity update
        remoteStreams.value = new Map(remoteStreams.value)
      }
      stream.addTrack(event.track)
      // Force reactivity update again after adding track
      remoteStreams.value = new Map(remoteStreams.value)
    }
    
    peerConnections.value.set(peerId, { peerId, connection, pendingCandidates: [] })
    
    // Create offer if we have lower ID (to prevent both sides creating offers)
    if (authStore.user.uid < peerId) {
      console.log(`Creating offer for peer ${peerId}`)
      const offer = await connection.createOffer()
      await connection.setLocalDescription(offer)
      
      sendSignal(serverStore.currentServer.id, currentVoiceChannel.value, {
        type: 'offer',
        from: authStore.user.uid,
        to: peerId,
        payload: offer
      })
    } else {
      console.log(`Waiting for offer from peer ${peerId}`)
    }
  }

  const closePeerConnection = (peerId: string) => {
    const peer = peerConnections.value.get(peerId)
    if (peer) {
      peer.connection.close()
      peerConnections.value.delete(peerId)
      remoteStreams.value.delete(peerId)
    }
  }

  const handleSignalingMessage = async (message: SignalingMessage) => {
    const authStore = useAuthStore()
    const serverStore = useServerStore()
    
    if (!authStore.user || !serverStore.currentServer || !currentVoiceChannel.value) return
    
    let peer = peerConnections.value.get(message.from)
    
    if (!peer && message.type === 'offer') {
      await createPeerConnection(message.from)
      peer = peerConnections.value.get(message.from)
    }
    
    if (!peer) return
    
    const { connection } = peer
    
    switch (message.type) {
      case 'offer':
        console.log(`Processing offer from ${message.from}`)
        await connection.setRemoteDescription(message.payload as RTCSessionDescriptionInit)
        
        // Process any buffered ICE candidates
        const peer1 = peerConnections.value.get(message.from)
        if (peer1 && peer1.pendingCandidates.length > 0) {
          console.log(`Adding ${peer1.pendingCandidates.length} buffered ICE candidates`)
          for (const candidate of peer1.pendingCandidates) {
            await connection.addIceCandidate(candidate)
          }
          peer1.pendingCandidates = []
        }
        
        const answer = await connection.createAnswer()
        await connection.setLocalDescription(answer)
        
        sendSignal(serverStore.currentServer.id, currentVoiceChannel.value, {
          type: 'answer',
          from: authStore.user.uid,
          to: message.from,
          payload: answer
        })
        break
        
      case 'answer':
        console.log(`Processing answer from ${message.from}`)
        await connection.setRemoteDescription(message.payload as RTCSessionDescriptionInit)
        
        // Process any buffered ICE candidates
        const peer2 = peerConnections.value.get(message.from)
        if (peer2 && peer2.pendingCandidates.length > 0) {
          console.log(`Adding ${peer2.pendingCandidates.length} buffered ICE candidates`)
          for (const candidate of peer2.pendingCandidates) {
            await connection.addIceCandidate(candidate)
          }
          peer2.pendingCandidates = []
        }
        break
        
      case 'ice-candidate':
        // Buffer ICE candidates if remote description not set yet
        if (!connection.remoteDescription) {
          console.log(`Buffering ICE candidate from ${message.from}`)
          const peer3 = peerConnections.value.get(message.from)
          if (peer3) {
            peer3.pendingCandidates.push(message.payload as RTCIceCandidateInit)
          }
        } else {
          console.log(`Adding ICE candidate from ${message.from}`)
          await connection.addIceCandidate(message.payload as RTCIceCandidateInit)
        }
        break
    }
  }

  return {
    isConnected,
    isMuted,
    isDeafened,
    isStreaming,
    currentVoiceChannel,
    connectedUsers,
    localStream,
    screenStream,
    remoteStreams,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    startStreaming,
    stopStreaming
  }
})
