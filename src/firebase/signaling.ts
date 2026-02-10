import { ref, set, off, push, onChildAdded, remove } from 'firebase/database'
import { rtdb } from './config'

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate'
  from: string
  to: string
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit
  timestamp?: number
}

// WebRTC Signaling for voice/video calls
export const sendSignal = (serverId: string, channelId: string, message: SignalingMessage) => {
  const signalingRef = ref(rtdb, `signaling/${serverId}/${channelId}`)
  const newRef = push(signalingRef)
  set(newRef, {
    ...message,
    timestamp: Date.now()
  })
}

export const subscribeToSignaling = (
  serverId: string, 
  channelId: string, 
  userId: string,
  callback: (message: SignalingMessage) => void
) => {
  const signalingRef = ref(rtdb, `signaling/${serverId}/${channelId}`)
  
  // Only listen to messages created after subscription time
  const subscribeTime = Date.now()
  
  onChildAdded(signalingRef, (snapshot) => {
    const message = snapshot.val() as SignalingMessage
    
    // Ignore old messages (created before we subscribed)
    if (message.timestamp && message.timestamp < subscribeTime - 5000) {
      remove(snapshot.ref)
      return
    }
    
    if (message.to === userId) {
      callback(message)
      // Remove processed message to keep database clean
      remove(snapshot.ref)
    }
  })
  
  return () => off(signalingRef)
}

// Clean up old signaling messages for a channel
export const cleanupUserSignaling = (serverId: string, channelId: string) => {
  const signalingRef = ref(rtdb, `signaling/${serverId}/${channelId}`)
  set(signalingRef, null)
}
