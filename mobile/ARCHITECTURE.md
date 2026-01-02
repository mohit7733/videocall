# Architecture Overview

## Project Structure

```
mobile/
├── App.js                      # Main app entry with navigation
├── screens/
│   ├── HomeScreen.js           # Entry screen (room/user input)
│   └── VideoCallScreen.js     # Video call UI with controls
├── services/
│   ├── webrtcService.js        # WebRTC peer connection logic
│   └── socketService.js        # Socket.IO signaling client
├── hooks/
│   └── useWebRTC.js            # React hook wrapping WebRTC logic
└── Configuration files...
```

## Data Flow

### 1. Initialization Flow

```
User enters Room ID & User ID
    ↓
HomeScreen → Navigation → VideoCallScreen
    ↓
useWebRTC hook initializes
    ↓
SocketService connects to backend
    ↓
WebRTCService requests media (getUserMedia)
    ↓
Socket emits 'join-room'
    ↓
Backend responds with 'room-joined'
```

### 2. WebRTC Connection Flow

```
Both users join room
    ↓
First user creates offer
    ↓
Offer sent via Socket.IO
    ↓
Second user receives offer
    ↓
Second user creates answer
    ↓
Answer sent via Socket.IO
    ↓
ICE candidates exchanged
    ↓
Peer connection established
    ↓
Media streams flow
```

## Component Responsibilities

### App.js
- Sets up React Navigation
- Defines screen routes
- Provides navigation context

### HomeScreen.js
- User input for Room ID and User ID
- Navigation to VideoCallScreen
- Basic validation

### VideoCallScreen.js
- Displays local and remote video streams
- Shows connection status
- Provides control buttons (mute, video, switch camera, end call)
- Handles user interactions

### useWebRTC Hook
- Manages WebRTC lifecycle
- Coordinates between SocketService and WebRTCService
- Provides state and methods to VideoCallScreen
- Handles cleanup on unmount

### WebRTCService
- Manages RTCPeerConnection
- Handles local/remote media streams
- Implements offer/answer/ICE candidate logic
- Provides camera switching, mute, video toggle
- Handles stream management

### SocketService
- Manages Socket.IO connection
- Handles signaling events (offer, answer, ICE candidates)
- Manages room events (join, leave)
- Provides connection status

## WebRTC Flow Details

### Offer Creation
1. User A joins room
2. User A gets local media stream
3. User A creates RTCPeerConnection
4. User A creates offer
5. User A sets local description
6. User A sends offer via Socket.IO

### Answer Creation
1. User B receives offer
2. User B gets local media stream (if not already)
3. User B creates RTCPeerConnection
4. User B sets remote description (offer)
5. User B creates answer
6. User B sets local description (answer)
7. User B sends answer via Socket.IO

### ICE Candidates
- Generated automatically by RTCPeerConnection
- Sent via Socket.IO as they're generated
- Added to peer connection when received
- Used for NAT traversal

## State Management

### Local State (VideoCallScreen)
- `callDuration` - Call timer
- `isMuted` - Mute state (synced from WebRTCService)
- `isVideoEnabled` - Video state (synced from WebRTCService)
- `isFrontCamera` - Camera facing (synced from WebRTCService)

### WebRTC State (useWebRTC)
- `localStream` - Local media stream
- `remoteStream` - Remote media stream
- `isConnected` - Socket connection status
- `connectionState` - Peer connection state
- `error` - Error messages

### Service State (WebRTCService)
- `localStream` - Local MediaStream
- `remoteStream` - Remote MediaStream
- `peerConnection` - RTCPeerConnection instance
- `socket` - Socket.IO instance reference
- `isMuted` - Audio mute state
- `isVideoEnabled` - Video enabled state
- `isFrontCamera` - Camera facing mode

## Event Handlers

### Socket Events
- `connect` - Socket connected
- `disconnect` - Socket disconnected
- `room-joined` - Successfully joined room
- `user-joined` - Another user joined
- `user-left` - User left room
- `offer` - Received WebRTC offer
- `answer` - Received WebRTC answer
- `ice-candidate` - Received ICE candidate
- `error` - Socket error

### WebRTC Events
- `ontrack` - Remote stream received
- `onconnectionstatechange` - Connection state changed
- `oniceconnectionstatechange` - ICE connection state changed
- `onicecandidate` - ICE candidate generated

## Permissions

### iOS
- Camera: `NSCameraUsageDescription` in Info.plist
- Microphone: `NSMicrophoneUsageDescription` in Info.plist
- Requested automatically by `mediaDevices.getUserMedia()`

### Android
- `CAMERA` - Camera access
- `RECORD_AUDIO` - Microphone access
- `MODIFY_AUDIO_SETTINGS` - Audio settings
- `INTERNET` - Network access
- Requested automatically by `mediaDevices.getUserMedia()`

## Error Handling

### Connection Errors
- Socket connection failures → Show error, allow retry
- WebRTC connection failures → Log, attempt reconnection
- Media access failures → Show permission error

### Stream Errors
- No camera/microphone → Show error message
- Stream stopped → Attempt to restart
- Track errors → Log and continue

## Cleanup

### On Component Unmount
1. Stop all media tracks
2. Close peer connection
3. Disconnect socket
4. Clear all references
5. Remove event listeners

### On Call End
1. Leave room via Socket.IO
2. Stop local stream
3. Close peer connection
4. Disconnect socket
5. Navigate back to home

## Performance Considerations

### Video Quality
- Default: 1280x720 (can be adjusted)
- Consider network conditions
- May need to adjust based on device capabilities

### Memory Management
- Streams are properly cleaned up
- Peer connections are closed
- Event listeners are removed
- No memory leaks

### Network Optimization
- ICE candidate pooling (10 candidates)
- Efficient signaling (only necessary data)
- Connection state monitoring

## Extensibility

### Adding Features
- Screen sharing: Add `getDisplayMedia()` in WebRTCService
- Chat: Add data channel to RTCPeerConnection
- Recording: Use MediaRecorder API
- Multiple participants: Extend to handle multiple peer connections

### Customization
- UI: Modify VideoCallScreen styles
- Controls: Add/remove buttons in VideoCallScreen
- Quality: Adjust video constraints in WebRTCService
- Servers: Update STUN/TURN in WebRTCService

