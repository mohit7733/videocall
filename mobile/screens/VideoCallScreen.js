import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useWebRTC } from '../hooks/useWebRTC';

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
// Update roomId and userId as needed
// These can come from navigation params or props

const VideoCallScreen = ({ route, navigation }) => {
  // Get roomId and userId from route params or use defaults
  const roomId = route?.params?.roomId || 'test-room-123';
  const userId = route?.params?.userId || 'user-' + Date.now();

  const {
    localStream,
    remoteStream,
    isConnected,
    connectionState,
    error,
    toggleMute,
    toggleVideo,
    switchCamera,
    endCall,
    getState,
  } = useWebRTC(roomId, userId);

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // Update state from WebRTC service
  useEffect(() => {
    const interval = setInterval(() => {
      const state = getState();
      setIsMuted(state.isMuted);
      setIsVideoEnabled(state.isVideoEnabled);
      setIsFrontCamera(state.isFrontCamera);
    }, 500);

    return () => clearInterval(interval);
  }, [getState]);

  // Call duration timer
  useEffect(() => {
    if (isConnected && remoteStream) {
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isConnected, remoteStream]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [error, navigation]);

  // Format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle mute toggle
  const handleToggleMute = () => {
    toggleMute();
  };

  // Handle video toggle
  const handleToggleVideo = () => {
    toggleVideo();
  };

  // Handle camera switch
  const handleSwitchCamera = async () => {
    await switchCamera();
  };

  // Handle end call
  const handleEndCall = () => {
    Alert.alert('End Call', 'Are you sure you want to end the call?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Call',
        style: 'destructive',
        onPress: () => {
          endCall();
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.statusIndicator,
              isConnected ? styles.statusConnected : styles.statusConnecting,
            ]}
          />
          <Text style={styles.roomId}>Room: {roomId}</Text>
        </View>
        <Text style={styles.duration}>{formatTime(callDuration)}</Text>
      </View>

      {/* Video Container */}
      <View style={styles.videoContainer}>
        {/* Remote Video */}
        <View style={styles.remoteVideoContainer}>
          {remoteStream ? (
            <RTCView
              streamURL={remoteStream.toURL()}
              style={styles.remoteVideo}
              objectFit="cover"
              mirror={false}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>Waiting for participant...</Text>
              <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
            </View>
          )}
        </View>

        {/* Local Video */}
        <View style={styles.localVideoContainer}>
          {localStream ? (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localVideo}
              objectFit="cover"
              mirror={isFrontCamera}
              zOrder={1}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          )}
          
          {/* Local video overlay */}
          {!isVideoEnabled && (
            <View style={styles.videoDisabledOverlay}>
              <Text style={styles.videoDisabledText}>Camera Off</Text>
            </View>
          )}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Mute Button */}
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={handleToggleMute}
        >
          <Text style={styles.controlButtonIcon}>
            {isMuted ? '🔇' : '🎤'}
          </Text>
          <Text style={styles.controlButtonLabel}>
            {isMuted ? 'Unmute' : 'Mute'}
          </Text>
        </TouchableOpacity>

        {/* Video Toggle Button */}
        <TouchableOpacity
          style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
          onPress={handleToggleVideo}
        >
          <Text style={styles.controlButtonIcon}>
            {isVideoEnabled ? '📹' : '📷'}
          </Text>
          <Text style={styles.controlButtonLabel}>
            {isVideoEnabled ? 'Video Off' : 'Video On'}
          </Text>
        </TouchableOpacity>

        {/* Switch Camera Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleSwitchCamera}
        >
          <Text style={styles.controlButtonIcon}>🔄</Text>
          <Text style={styles.controlButtonLabel}>Switch</Text>
        </TouchableOpacity>

        {/* End Call Button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <Text style={styles.controlButtonIcon}>📞</Text>
          <Text style={styles.controlButtonLabel}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Status: {connectionState} {isConnected ? '✓' : '...'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  statusConnecting: {
    backgroundColor: '#FFC107',
  },
  roomId: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  duration: {
    color: '#ffffff',
    fontSize: 14,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#000000',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333333',
  },
  localVideo: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  loader: {
    marginTop: 8,
  },
  videoDisabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDisabledText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#333333',
  },
  controlButtonActive: {
    backgroundColor: '#d32f2f',
  },
  endCallButton: {
    backgroundColor: '#d32f2f',
  },
  controlButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlButtonLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  statusBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default VideoCallScreen;

