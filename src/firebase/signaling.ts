import { ref, set, off, push, onChildAdded, serverTimestamp } from 'firebase/database'
import { rtdb } from './config'

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate'
  from: string
  to: string
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit
}

// WebRTC Signaling for voice/video calls
export const sendSignal = (serverId: string, channelId: string, message: SignalingMessage) => {
  const signalingRef = ref(rtdb, `signaling/${serverId}/${channelId}`)
  push(signalingRef, {
    ...message,
    timestamp: serverTimestamp()
  })
}

export const subscribeToSignaling = (
  serverId: string, 
  channelId: string, 
  userId: string,
  callback: (message: SignalingMessage) => void
) => {
  const signalingRef = ref(rtdb, `signaling/${serverId}/${channelId}`)
  
  onChildAdded(signalingRef, (snapshot) => {
    const message = snapshot.val() as SignalingMessage
    if (message.to === userId) {
      callback(message)
    }
  })
  
  return () => off(signalingRef)
}

// Clean up old signaling messages
export const cleanupSignaling = (serverId: string, channelId: string) => {
  const signalingRef = ref(rtdb, `signaling/${serverId}/${channelId}`)
  set(signalingRef, null)
}
