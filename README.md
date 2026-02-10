# Cord - Discord-like Service

A private Discord-like communication platform built with Vue 3, TypeScript, and Firebase.

## Features

- **User Authentication** - Sign up, login, and user profiles with avatars
- **Servers** - Create and join servers (guilds) with invite codes
- **Text Channels** - Real-time messaging with message history
- **Voice Channels** - WebRTC-based voice chat with mute/deafen controls
- **Screen Sharing** - Share your screen with others in voice channels
- **User Presence** - Online/offline status indicators
- **Modern UI** - Discord-inspired dark theme interface

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **Backend**: Firebase
  - Authentication
  - Firestore (messages, servers, channels)
  - Realtime Database (presence, WebRTC signaling)
  - Storage (avatars, attachments)
- **Voice/Video**: WebRTC

## Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - **Authentication**: Enable Email/Password provider
   - **Firestore Database**: Create in production mode
   - **Realtime Database**: Create database
   - **Storage**: Set up storage bucket

### 2. Configure Firebase

Copy your Firebase config from Project Settings > General > Your apps > Web app

Create a `.env` file in the project root (you can copy from `.env.example`):

```bash
cp .env.example .env
```

Then fill in your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
```

> **Note**: The `.env` file is gitignored to keep your credentials secure.

### 3. Set up Firestore Rules

In Firebase Console > Firestore > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /servers/{serverId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.ownerId || request.auth.uid in resource.data.members);
      
      match /channels/{channelId} {
        allow read, write: if request.auth != null;
        
        match /messages/{messageId} {
          allow read: if request.auth != null;
          allow create: if request.auth != null;
          allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
        }
      }
    }
  }
}
```

### 4. Set up Realtime Database Rules

In Firebase Console > Realtime Database > Rules:

```json
{
  "rules": {
    "status": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    },
    "voice": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "signaling": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### 5. Set up Storage Rules

In Firebase Console > Storage > Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /servers/{serverId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. **Register** - Create an account with email and password
2. **Create a Server** - Click the + button in the server list
3. **Invite Friends** - Share your server's invite code
4. **Chat** - Select a text channel and start messaging
5. **Voice Chat** - Join a voice channel to talk with others
6. **Screen Share** - Click the screen share button while in voice

## Project Structure

```
src/
├── assets/          # CSS and static assets
├── components/      # Vue components
├── firebase/        # Firebase configuration and services
├── router/          # Vue Router configuration
├── stores/          # Pinia stores
├── types/           # TypeScript types
└── views/           # Page components
```

## Future Features

- Direct messages
- File attachments
- Emoji reactions
- Role-based permissions
- Server settings
- Notification system
- Mobile responsive design

## License

MIT
