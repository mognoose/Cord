import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  type User 
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { createUserProfile, getUserProfile, updateUserProfile } from '../firebase/firestore'
import { setUserPresence, updateUserStatus, type UserStatus } from '../firebase/presence'
import type { UserProfile } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  const initAuth = () => {
    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        user.value = firebaseUser
        
        if (firebaseUser) {
          profile.value = await getUserProfile(firebaseUser.uid)
          setUserPresence(firebaseUser.uid, 'online')
        } else {
          profile.value = null
        }
        
        loading.value = false
        resolve()
      })
    })
  }

  const register = async (email: string, password: string, username: string) => {
    try {
      error.value = null
      loading.value = true
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      await updateProfile(userCredential.user, { displayName: username })
      
      await createUserProfile(userCredential.user.uid, {
        email,
        username,
        displayName: username
      })
      
      profile.value = await getUserProfile(userCredential.user.uid)
      setUserPresence(userCredential.user.uid, 'online')
      
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    try {
      error.value = null
      loading.value = true
      
      await signInWithEmailAndPassword(auth, email, password)
      
      if (user.value) {
        profile.value = await getUserProfile(user.value.uid)
        setUserPresence(user.value.uid, 'online')
      }
      
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      if (user.value) {
        updateUserStatus(user.value.uid, 'offline')
      }
      await signOut(auth)
      user.value = null
      profile.value = null
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  const updateStatus = (status: UserStatus) => {
    if (user.value) {
      updateUserStatus(user.value.uid, status)
    }
  }

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (user.value) {
      await updateUserProfile(user.value.uid, data)
      profile.value = await getUserProfile(user.value.uid)
    }
  }

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    initAuth,
    register,
    login,
    logout,
    updateStatus,
    updateProfileData
  }
})
