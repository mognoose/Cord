import { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  id: string
  email: string
  username: string
  displayName?: string
  avatarUrl?: string
  status?: 'online' | 'idle' | 'dnd' | 'offline'
  customStatus?: string
  bio?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Server {
  id: string
  name: string
  iconUrl?: string
  ownerId: string
  members: string[]
  description?: string
  inviteCode?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Channel {
  id: string
  name: string
  type: 'text' | 'voice'
  description?: string
  position?: number
  createdAt: Timestamp
}

export interface Message {
  id: string
  content: string
  authorId: string
  authorName: string
  authorAvatarUrl?: string
  attachments?: Attachment[]
  edited?: boolean
  createdAt: Timestamp
}

export interface Attachment {
  url: string
  name: string
  type: string
  size: number
}

export interface VoiceState {
  odUserId: string
  username: string
  avatarUrl?: string
  muted: boolean
  deafened: boolean
  streaming: boolean
  joinedAt: number
}
