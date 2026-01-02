# React Native Video Call App - Setup Instructions

## Step-by-Step Setup Guide

### Step 1: Install Dependencies

```bash
cd mobile
npm install
```

### Step 2: Update Configuration

#### 2.1 Update Backend URL

Open `mobile/services/webrtcService.js` and find line 10:

```javascript
export const SOCKET_URL = 'https://vcxtv1pq-5000.inc1.devtunnels.ms';
```

Replace with your backend URL:

```javascript
export const SOCKET_URL = 'YOUR_BACKEND_URL_HERE';
```

**Important:** 
- Use `http://` for local development (e.g., `http://192.168.1.100:5000`)
- Use `https://` for production
- Do NOT use `localhost` or `127.0.0.1` on physical devices

#### 2.2 Update STUN/TURN Servers (Optional)

If you have custom STUN/TURN servers, update `RTC_CONFIGURATION` in `mobile/services/webrtcService.js`:

```javascript
export const RTC_CONFIGURATION = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add your TURN servers:
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-password'
    }
  ],
  iceCandidatePoolSize: 10,
};
```

### Step 3: iOS Setup

#### 3.1 Install CocoaPods (if using bare React Native)

```bash
cd ios
pod install
cd ..
```

#### 3.2 Run on iOS

```bash
# Start Metro bundler
npm start

# In a new terminal
npm run ios
```

**Note:** iOS simulator may have limited camera/microphone support. Test on a physical device for full functionality.

### Step 4: Android Setup

#### 4.1 Check Android Configuration

Ensure `android/build.gradle` has:
- `minSdkVersion 21` or higher
- Proper dependencies

#### 4.2 Run on Android

```bash
# Start Metro bundler
npm start

# In a new terminal
npm run android
```

**Note:** Android emulator may have limited camera/microphone support. Test on a physical device for full functionality.

### Step 5: Testing

1. **Start Backend Server**
   ```bash
   cd ../backend
   npm start
   ```

2. **Start Mobile App**
   ```bash
   cd mobile
   npm start
   ```

3. **Test Connection**
   - Open app on two devices (or one device + web browser)
   - Enter the same Room ID
   - Enter unique User IDs
   - Tap "Join Call"
   - Grant permissions when prompted
   - Wait for connection

## Commands Reference

### Development

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web (for testing)
npm run web
```

### Building

#### iOS

```bash
# Build for iOS (requires Xcode)
npx expo build:ios
```

#### Android

```bash
# Build APK
npx expo build:android
```

## Configuration Files

### Key Files to Modify

1. **Backend URL**: `mobile/services/webrtcService.js` (line 10)
2. **STUN/TURN**: `mobile/services/webrtcService.js` (lines 15-25)
3. **App Config**: `mobile/app.json` (permissions, bundle ID, etc.)

## Permissions

### iOS Permissions

Automatically configured in `app.json`:
- Camera: `NSCameraUsageDescription`
- Microphone: `NSMicrophoneUsageDescription`

### Android Permissions

Automatically configured in `app.json`:
- `CAMERA`
- `RECORD_AUDIO`
- `MODIFY_AUDIO_SETTINGS`
- `INTERNET`

## Network Configuration

### Local Development

For local testing, use your computer's local IP address:

1. Find your IP:
   - **Mac/Linux**: `ifconfig | grep "inet "`
   - **Windows**: `ipconfig`

2. Update backend URL:
   ```javascript
   export const SOCKET_URL = 'http://192.168.1.100:5000';
   ```

3. Ensure both devices are on the same network

### Production

Use your production backend URL:
```javascript
export const SOCKET_URL = 'https://your-production-url.com';
```

## Troubleshooting

### Issue: Cannot connect to backend

**Solution:**
- Verify backend URL is correct
- Check backend server is running
- Ensure network connectivity
- Check firewall settings

### Issue: Permissions not working

**Solution:**
- Check device settings → Apps → Permissions
- Restart app after granting permissions
- For iOS: Check Info.plist permissions
- For Android: Check AndroidManifest.xml

### Issue: Video not showing

**Solution:**
- Check camera permissions
- Verify stream is not null
- Check console logs for errors
- Test on physical device (not emulator)

### Issue: Audio not working

**Solution:**
- Check microphone permissions
- Verify audio tracks are enabled
- Check device volume
- Ensure not muted

## Next Steps

1. ✅ Update backend URL
2. ✅ Test on physical devices
3. ✅ Add TURN servers if needed
4. ✅ Configure production settings
5. ✅ Test with web version
6. ✅ Deploy to app stores

## Additional Resources

- [React Native WebRTC Docs](https://github.com/react-native-webrtc/react-native-webrtc)
- [Socket.IO Client Docs](https://socket.io/docs/v4/client-api/)
- [Expo Docs](https://docs.expo.dev/)

