import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { db } from './config'
import type { Server, Channel, Message, UserProfile } from '../types'

// User Profile operations
export const createUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }).catch(async () => {
    // If doc doesn't exist, create it
    const { setDoc } = await import('firebase/firestore')
    await setDoc(userRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  })
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() } as UserProfile
  }
  return null
}

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

// Server operations
export const createServer = async (data: Partial<Server>): Promise<string> => {
  const serverRef = await addDoc(collection(db, 'servers'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return serverRef.id
}

export const getServer = async (serverId: string): Promise<Server | null> => {
  const serverRef = doc(db, 'servers', serverId)
  const serverSnap = await getDoc(serverRef)
  if (serverSnap.exists()) {
    return { id: serverSnap.id, ...serverSnap.data() } as Server
  }
  return null
}

export const getUserServers = async (userId: string): Promise<Server[]> => {
  const q = query(
    collection(db, 'servers'),
    where('members', 'array-contains', userId)
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Server))
}

export const joinServer = async (serverId: string, userId: string) => {
  const serverRef = doc(db, 'servers', serverId)
  await updateDoc(serverRef, {
    members: arrayUnion(userId)
  })
}

export const getServerByInviteCode = async (inviteCode: string): Promise<Server | null> => {
  const q = query(
    collection(db, 'servers'),
    where('inviteCode', '==', inviteCode)
  )
  const querySnapshot = await getDocs(q)
  if (querySnapshot.empty) return null
  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() } as Server
}

export const leaveServer = async (serverId: string, userId: string) => {
  const serverRef = doc(db, 'servers', serverId)
  await updateDoc(serverRef, {
    members: arrayRemove(userId)
  })
}

export const deleteServer = async (serverId: string) => {
  await deleteDoc(doc(db, 'servers', serverId))
}

// Channel operations
export const createChannel = async (serverId: string, data: Partial<Channel>): Promise<string> => {
  const channelRef = await addDoc(collection(db, 'servers', serverId, 'channels'), {
    ...data,
    createdAt: serverTimestamp()
  })
  return channelRef.id
}

export const getChannels = async (serverId: string): Promise<Channel[]> => {
  const q = query(
    collection(db, 'servers', serverId, 'channels'),
    orderBy('createdAt', 'asc')
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel))
}

export const subscribeToChannels = (serverId: string, callback: (channels: Channel[]) => void) => {
  const q = query(
    collection(db, 'servers', serverId, 'channels'),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, (snapshot) => {
    const channels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel))
    callback(channels)
  })
}

export const deleteChannel = async (serverId: string, channelId: string) => {
  await deleteDoc(doc(db, 'servers', serverId, 'channels', channelId))
}

// Message operations
export const sendMessage = async (serverId: string, channelId: string, data: Partial<Message>): Promise<string> => {
  const messageRef = await addDoc(
    collection(db, 'servers', serverId, 'channels', channelId, 'messages'),
    {
      ...data,
      createdAt: serverTimestamp()
    }
  )
  return messageRef.id
}

export const getMessages = async (serverId: string, channelId: string, messageLimit = 50): Promise<Message[]> => {
  const q = query(
    collection(db, 'servers', serverId, 'channels', channelId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(messageLimit)
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse()
}

export const subscribeToMessages = (
  serverId: string, 
  channelId: string, 
  callback: (messages: Message[]) => void,
  messageLimit = 50
) => {
  const q = query(
    collection(db, 'servers', serverId, 'channels', channelId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(messageLimit)
  )
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse()
    callback(messages)
  })
}

export const deleteMessage = async (serverId: string, channelId: string, messageId: string) => {
  await deleteDoc(doc(db, 'servers', serverId, 'channels', channelId, 'messages', messageId))
}

export { serverTimestamp, Timestamp }
