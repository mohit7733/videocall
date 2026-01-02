# Video Call Mobile App - React Native

A React Native mobile application for WebRTC video calling that connects to your existing backend signaling server.

## Features

- ✅ One-to-one video calling
- ✅ Audio/video permissions handling
- ✅ Camera switch (front/back)
- ✅ Mute/unmute functionality
- ✅ End call
- ✅ Socket.IO integration with existing backend
- ✅ WebRTC peer connection management
- ✅ Real-time connection status

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- React Native development environment set up
- For iOS: Xcode (Mac only)
- For Android: Android Studio

## Installation

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Backend URL

Open `mobile/services/webrtcService.js` and update the `SOCKET_URL`:

```javascript
export const SOCKET_URL = 'YOUR_BACKEND_URL_HERE';
```

For example:
```javascript
export const SOCKET_URL = 'https://your-backend-url.com';
```

### 3. Configure STUN/TURN Servers (Optional)

If you have custom STUN/TURN servers, update `RTC_CONFIGURATION` in `mobile/services/webrtcService.js`:

```javascript
export const RTC_CONFIGURATION = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add your TURN servers here:
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'your-username',
    //   credential: 'your-password'
    // }
  ],
  iceCandidatePoolSize: 10,
};
```

## Running the App

### Prerequisites

#### iOS (Mac only)
- Xcode 14+ installed
- CocoaPods installed: `sudo gem install cocoapods`
- iOS Simulator or physical device

#### Android
- Android Studio installed
- Android SDK configured
- Android emulator or physical device

### iOS Setup

1. **Install CocoaPods dependencies:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Run the app:**
   ```bash
   # Start Metro bundler
   npm start

   # In a new terminal, run iOS
   npm run ios
   ```

   Or open in Xcode:
   ```bash
   open ios/VideoCallMobile.xcworkspace
   ```

### Android Setup

1. **Make sure Android emulator is running or device is connected:**
   ```bash
   adb devices
   ```

2. **Run the app:**
   ```bash
   # Start Metro bundler
   npm start

   # In a new terminal, run Android
   npm run android
   ```

## Permissions Setup

### iOS

The app automatically requests camera and microphone permissions. The permissions are configured in `ios/VideoCallMobile/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to your camera for video calls.</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to your microphone for video calls.</string>
```

### Android

Android permissions are configured in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.INTERNET" />
```

The app will automatically request these permissions when needed.

## Project Structure

```
mobile/
├── App.js                    # Main app component with navigation
├── screens/
│   ├── HomeScreen.js         # Home screen to enter room/user details
│   └── VideoCallScreen.js    # Video call screen with controls
├── services/
│   ├── webrtcService.js      # WebRTC service (UPDATE BACKEND URL HERE)
│   └── socketService.js      # Socket.IO service
├── hooks/
│   └── useWebRTC.js          # Custom hook for WebRTC functionality
├── package.json
└── app.json                  # Expo configuration
```

## Key Files to Update

### 1. Backend URL
**File:** `mobile/services/webrtcService.js`
**Line:** 10
```javascript
export const SOCKET_URL = 'YOUR_BACKEND_URL_HERE';
```

### 2. STUN/TURN Servers
**File:** `mobile/services/webrtcService.js`
**Lines:** 15-25
```javascript
export const RTC_CONFIGURATION = {
  iceServers: [
    // Update with your STUN/TURN servers
  ],
};
```

## Usage

1. **Start the app** on two devices (or one device + web browser)
2. **Enter the same Room ID** on both devices
3. **Enter unique User IDs** for each device
4. **Tap "Join Call"**
5. **Grant permissions** when prompted
6. **Wait for connection** - the app will automatically establish the WebRTC connection

## WebRTC Flow

The app follows the same WebRTC flow as your web version:

1. **getUserMedia** - Request camera/microphone access
2. **Socket Connection** - Connect to signaling server
3. **Join Room** - Join the specified room
4. **RTCPeerConnection** - Create peer connection
5. **Offer/Answer Exchange** - Exchange SDP offers and answers via Socket.IO
6. **ICE Candidates** - Exchange ICE candidates for NAT traversal
7. **Media Streaming** - Stream audio/video once connected

## Common Issues and Solutions

### 1. Camera/Microphone Not Working

**Problem:** Permissions not granted or devices not accessible.

**Solution:**
- Check device settings → Apps → Permissions
- Restart the app after granting permissions
- Ensure no other app is using the camera/microphone

### 2. Connection Fails

**Problem:** Cannot establish WebRTC connection.

**Solutions:**
- Check backend URL is correct and accessible
- Verify STUN/TURN servers are reachable
- Check network connectivity
- Ensure both devices are on the same network or have proper NAT traversal
- Consider adding TURN servers for better connectivity

### 3. Black Screen on Video

**Problem:** Video stream not displaying.

**Solutions:**
- Check if `localStream` and `remoteStream` are not null
- Verify camera permissions are granted
- Check console logs for errors
- Ensure `RTCView` component is receiving the stream URL correctly

### 4. Audio Not Working

**Problem:** No audio in call.

**Solutions:**
- Check microphone permissions
- Verify audio tracks are enabled: `track.enabled = true`
- Check device volume settings
- Ensure audio is not muted

### 5. Socket Connection Errors

**Problem:** Cannot connect to signaling server.

**Solutions:**
- Verify backend URL is correct
- Check if backend server is running
- Ensure network allows WebSocket connections
- Check CORS settings on backend (should allow all origins for mobile)

### 6. iOS Build Issues

**Problem:** Build fails on iOS.

**Solutions:**
- Run `cd ios && pod install` (if using bare React Native)
- Clean build: `cd ios && xcodebuild clean`
- Check Xcode version compatibility
- Ensure CocoaPods is up to date

### 7. Android Build Issues

**Problem:** Build fails on Android.

**Solutions:**
- Clean build: `cd android && ./gradlew clean`
- Check Android SDK version (minimum API 21)
- Ensure all dependencies are installed
- Check `android/build.gradle` for correct versions

### 8. WebRTC Not Working on Physical Devices

**Problem:** Works on emulator but not on real device.

**Solutions:**
- Use HTTPS or local network IP (not localhost)
- Check device firewall/security settings
- Ensure proper network configuration
- Test with TURN servers for better NAT traversal

## Testing

### Test with Web Version

1. Start your web app
2. Start the mobile app
3. Use the same room ID on both
4. Both should connect and see each other

### Test on Same Network

For best results during development:
- Connect both devices to the same Wi-Fi network
- Use the local IP address of your backend server
- Example: `http://192.168.1.100:5000`

## Production Considerations

1. **TURN Servers**: Add TURN servers for better connectivity across different networks
2. **Error Handling**: Implement retry logic for failed connections
3. **Reconnection**: Handle network interruptions gracefully
4. **Performance**: Optimize video quality based on network conditions
5. **Security**: Use HTTPS/WSS in production
6. **Analytics**: Add connection quality monitoring

## Troubleshooting

### Enable Debug Logging

The app includes extensive console logging. Check your Metro bundler console or device logs for detailed information.

### Check Connection State

The app displays connection state in the status bar. Monitor this to understand connection issues.

### Network Debugging

Use tools like:
- Chrome DevTools (for web testing)
- React Native Debugger
- Wireshark (for network analysis)

## Support

For issues specific to:
- **react-native-webrtc**: Check [react-native-webrtc documentation](https://github.com/react-native-webrtc/react-native-webrtc)
- **Socket.IO**: Check [Socket.IO client documentation](https://socket.io/docs/v4/client-api/)
- **Expo**: Check [Expo documentation](https://docs.expo.dev/)

## License

Same as your main project.

