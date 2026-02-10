import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './config'

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const avatarRef = ref(storage, `avatars/${userId}/${file.name}`)
  await uploadBytes(avatarRef, file)
  return getDownloadURL(avatarRef)
}

export const uploadServerIcon = async (serverId: string, file: File): Promise<string> => {
  const iconRef = ref(storage, `servers/${serverId}/icon/${file.name}`)
  await uploadBytes(iconRef, file)
  return getDownloadURL(iconRef)
}

export const uploadAttachment = async (
  serverId: string, 
  channelId: string, 
  messageId: string, 
  file: File
): Promise<string> => {
  const attachmentRef = ref(storage, `servers/${serverId}/channels/${channelId}/attachments/${messageId}/${file.name}`)
  await uploadBytes(attachmentRef, file)
  return getDownloadURL(attachmentRef)
}

export const deleteFile = async (path: string) => {
  const fileRef = ref(storage, path)
  await deleteObject(fileRef)
}
