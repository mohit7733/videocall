# Initial Setup Guide - Bare React Native

This guide will help you set up the React Native project from scratch.

## Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **React Native CLI**
   ```bash
   npm install -g react-native-cli
   ```

3. **For iOS (Mac only):**
   - Xcode 14+ from Mac App Store
   - CocoaPods: `sudo gem install cocoapods`
   - Xcode Command Line Tools: `xcode-select --install`

4. **For Android:**
   - Android Studio from: https://developer.android.com/studio
   - Android SDK (API 21+)
   - Android emulator or physical device
   - Set ANDROID_HOME environment variable

## Project Setup

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

### 3. Android Setup

No additional setup needed. The project is pre-configured.

### 4. Update Backend URL

Edit `mobile/services/webrtcService.js` line 10:

```javascript
export const SOCKET_URL = 'YOUR_BACKEND_URL_HERE';
```

## Running the App

### iOS

```bash
# Terminal 1: Start Metro
npm start

# Terminal 2: Run iOS
npm run ios
```

### Android

```bash
# Make sure emulator is running or device connected
adb devices

# Terminal 1: Start Metro
npm start

# Terminal 2: Run Android
npm run android
```

## Troubleshooting

### iOS Issues

**Problem: Pod install fails**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**Problem: Build fails in Xcode**
- Clean build folder: Product → Clean Build Folder (Shift+Cmd+K)
- Delete DerivedData folder
- Re-run `pod install`

**Problem: "No such module 'React'**
```bash
cd ios
pod install
cd ..
```

### Android Issues

**Problem: Gradle build fails**
```bash
cd android
./gradlew clean
cd ..
```

**Problem: "SDK location not found"**
- Set ANDROID_HOME in your environment:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/tools
  export PATH=$PATH:$ANDROID_HOME/tools/bin
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

**Problem: Metro bundler connection issues**
- Reset Metro cache: `npm start -- --reset-cache`
- Check firewall settings

### General Issues

**Problem: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start -- --reset-cache
```

**Problem: Version conflicts**
- Check Node.js version: `node --version` (should be 16+)
- Check React Native version compatibility

## Project Structure

```
mobile/
├── android/          # Android native code
├── ios/              # iOS native code
├── src/              # Source code (if you organize it)
├── screens/          # Screen components
├── services/         # WebRTC and Socket services
├── hooks/            # React hooks
├── App.js            # Main app component
├── index.js          # Entry point
└── package.json      # Dependencies
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up iOS (if on Mac)
3. ✅ Update backend URL
4. ✅ Test on device/emulator
5. ✅ Connect to your backend

## Need Help?

- Check the main README.md for detailed documentation
- Review SETUP.md for step-by-step instructions
- Check React Native docs: https://reactnative.dev/docs/getting-started

