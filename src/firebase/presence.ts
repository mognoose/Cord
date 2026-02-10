import { ref, set, onValue, onDisconnect, serverTimestamp, off } from 'firebase/database'
import { rtdb } from './config'

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline'

export const setUserPresence = (userId: string, status: UserStatus = 'online') => {
  const userStatusRef = ref(rtdb, `status/${userId}`)
  const connectedRef = ref(rtdb, '.info/connected')

  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === false) return

    onDisconnect(userStatusRef).set({
      status: 'offline',
      lastSeen: serverTimestamp()
    }).then(() => {
      set(userStatusRef, {
        status,
        lastSeen: serverTimestamp()
      })
    })
  })
}

export const updateUserStatus = (userId: string, status: UserStatus) => {
  const userStatusRef = ref(rtdb, `status/${userId}`)
  set(userStatusRef, {
    status,
    lastSeen: serverTimestamp()
  })
}

export const subscribeToUserPresence = (
  userId: string, 
  callback: (status: { status: UserStatus; lastSeen: number }) => void
) => {
  const userStatusRef = ref(rtdb, `status/${userId}`)
  onValue(userStatusRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      callback(data)
    } else {
      callback({ status: 'offline', lastSeen: Date.now() })
    }
  })
  return () => off(userStatusRef)
}

// Voice channel presence
export const joinVoiceChannel = (serverId: string, channelId: string, userId: string, userData: { username: string; avatarUrl?: string }) => {
  const voiceRef = ref(rtdb, `voice/${serverId}/${channelId}/${userId}`)
  
  onDisconnect(voiceRef).remove()
  
  set(voiceRef, {
    username: userData.username,
    ...(userData.avatarUrl && { avatarUrl: userData.avatarUrl }),
    joinedAt: serverTimestamp(),
    muted: false,
    deafened: false,
    streaming: false
  })
}

export const leaveVoiceChannel = (serverId: string, channelId: string, userId: string) => {
  const voiceRef = ref(rtdb, `voice/${serverId}/${channelId}/${userId}`)
  set(voiceRef, null)
}

export const updateVoiceState = (
  serverId: string, 
  channelId: string, 
  userId: string, 
  state: { muted?: boolean; deafened?: boolean; streaming?: boolean }
) => {
  const voiceRef = ref(rtdb, `voice/${serverId}/${channelId}/${userId}`)
  // Use update for partial updates
  const { update } = require('firebase/database')
  update(voiceRef, state)
}

export const subscribeToVoiceChannel = (
  serverId: string, 
  channelId: string, 
  callback: (users: Record<string, any>) => void
) => {
  const voiceRef = ref(rtdb, `voice/${serverId}/${channelId}`)
  onValue(voiceRef, (snapshot) => {
    callback(snapshot.val() || {})
  })
  return () => off(voiceRef)
}
