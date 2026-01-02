# React Native Video Call App (Bare React Native)

This is a **bare React Native** project (NOT Expo). It uses React Native CLI and requires native code setup.

## ✅ What's Different from Expo

- **No Expo Go** - You build and run the app directly
- **Native code access** - Full access to iOS and Android native code
- **Manual linking** - Some packages may require manual linking
- **Native builds** - Requires Xcode (iOS) and Android Studio (Android)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. iOS Setup (Mac only)

```bash
cd ios
pod install
cd ..
```

### 3. Update Backend URL

Edit `mobile/services/webrtcService.js` line 10:

```javascript
export const SOCKET_URL = 'YOUR_BACKEND_URL_HERE';
```

### 4. Run the App

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

## 📋 Prerequisites

### Required

- Node.js 16+
- React Native CLI: `npm install -g react-native-cli`
- For iOS: Xcode 14+, CocoaPods
- For Android: Android Studio, Android SDK

### Installation

**React Native CLI:**
```bash
npm install -g react-native-cli
```

**CocoaPods (iOS):**
```bash
sudo gem install cocoapods
```

## 🏗️ Project Structure

```
mobile/
├── android/              # Android native code
│   ├── app/
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── java/com/videocallmobile/
│   └── build.gradle
├── ios/                  # iOS native code
│   ├── VideoCallMobile/
│   │   ├── Info.plist
│   │   └── AppDelegate files
│   └── Podfile
├── screens/              # React Native screens
├── services/             # WebRTC & Socket services
├── hooks/                # React hooks
├── App.js                # Main app component
├── index.js              # Entry point
└── package.json
```

## 🔧 Configuration

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

## 📱 Running on Devices

### iOS

1. Connect iPhone via USB
2. Trust computer on iPhone
3. Open Xcode: `open ios/VideoCallMobile.xcworkspace`
4. Select your device
5. Click Run

Or use CLI:
```bash
npm run ios -- --device "Your Device Name"
```

### Android

1. Enable USB debugging on Android device
2. Connect via USB
3. Verify: `adb devices`
4. Run: `npm run android`

## 🐛 Troubleshooting

### iOS Issues

**Pod install fails:**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**Build fails:**
- Clean in Xcode: Product → Clean Build Folder
- Delete DerivedData
- Re-run `pod install`

### Android Issues

**Gradle build fails:**
```bash
cd android
./gradlew clean
cd ..
```

**SDK not found:**
Set ANDROID_HOME:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### General Issues

**Module not found:**
```bash
rm -rf node_modules
npm install
npm start -- --reset-cache
```

**Metro bundler issues:**
```bash
npm start -- --reset-cache
```

## 📚 Documentation

- **Setup Guide:** See `SETUP.md`
- **Quick Start:** See `QUICK_START.md`
- **Initial Setup:** See `INITIAL_SETUP.md`
- **Architecture:** See `ARCHITECTURE.md`

## 🔗 Useful Links

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)

## ⚠️ Important Notes

1. **No Expo Go** - This is bare React Native, you must build the app
2. **Physical devices recommended** - Emulators have limited camera/mic support
3. **Native code access** - You can modify iOS/Android native code directly
4. **Build required** - Changes to native code require rebuilding

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Set up iOS (if on Mac)
3. ✅ Update backend URL
4. ✅ Test on device
5. ✅ Connect to your backend

