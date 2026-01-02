# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Update Backend URL
Edit `mobile/services/webrtcService.js` line 10:
```javascript
export const SOCKET_URL = 'YOUR_BACKEND_URL_HERE';
```

### 3. Run the App
```bash
# iOS
npm run ios

# Android
npm run android
```

## 📱 Testing

1. **Start your backend server** (if not already running)
2. **Open the app on two devices** (or one device + web browser)
3. **Enter the same Room ID** on both
4. **Enter unique User IDs**
5. **Tap "Join Call"**
6. **Grant permissions** when prompted

## ⚙️ Configuration

### Backend URL
**File:** `mobile/services/webrtcService.js`
```javascript
export const SOCKET_URL = 'https://your-backend-url.com';
```

### STUN/TURN Servers
**File:** `mobile/services/webrtcService.js`
```javascript
export const RTC_CONFIGURATION = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add TURN servers here
  ],
};
```

## 🔧 Common Commands

```bash
# Start Metro bundler
npm start

# Run iOS
npm run ios

# Run Android
npm run android

# Clear cache
npm start -- --reset-cache
```

## ⚠️ Important Notes

- **Use physical devices** for testing (emulators have limited camera/mic support)
- **Same network** recommended for local testing
- **Use local IP** (not localhost) when testing on physical devices
- **Grant permissions** when prompted for camera/microphone

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect | Check backend URL and server status |
| No video | Grant camera permissions, check device |
| No audio | Grant microphone permissions, check volume |
| Black screen | Check stream is not null, check logs |

## 📚 Full Documentation

See `README.md` and `SETUP.md` for detailed information.

