import { useEffect, useRef, useState, useCallback } from 'react';
import WebRTCService from '../services/webrtcService';
import SocketService from '../services/socketService';

/**
 * Custom hook for WebRTC video calling
 * 
 * @param {string} roomId - Room ID for the call
 * @param {string} userId - User ID
 * @returns {object} WebRTC state and methods
 */
export const useWebRTC = (roomId, userId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [error, setError] = useState(null);

  const webrtcServiceRef = useRef(null);
  const socketServiceRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Initialize services
  useEffect(() => {
    if (!roomId || !userId || isInitializedRef.current) {
      return;
    }

    console.log('Initializing WebRTC hook:', { roomId, userId });

    // Initialize WebRTC service
    webrtcServiceRef.current = new WebRTCService();
    webrtcServiceRef.current.roomId = roomId;
    webrtcServiceRef.current.userId = userId;

    // Initialize Socket service
    socketServiceRef.current = new SocketService();
    socketServiceRef.current.roomId = roomId;
    socketServiceRef.current.userId = userId;

    // Set up WebRTC callbacks
    webrtcServiceRef.current.onLocalStream = (stream) => {
      setLocalStream(stream);
    };

    webrtcServiceRef.current.onRemoteStream = (stream) => {
      setRemoteStream(stream);
    };

    webrtcServiceRef.current.onConnectionStateChange = (state) => {
      setConnectionState(state);
      setIsConnected(state === 'connected');
    };

    webrtcServiceRef.current.onError = (errorMessage) => {
      setError(errorMessage);
    };

    // Set up Socket callbacks
    socketServiceRef.current.onConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    socketServiceRef.current.onDisconnect = () => {
      setIsConnected(false);
    };

    socketServiceRef.current.onError = (errorMessage) => {
      setError(errorMessage);
    };

    socketServiceRef.current.onRoomJoined = async (data) => {
      console.log('Room joined, participants:', data.participants);
      
      // Initialize local stream
      try {
        await webrtcServiceRef.current.initializeLocalStream();
      } catch (err) {
        console.error('Failed to initialize local stream:', err);
        setError('Failed to access camera/microphone');
        return;
      }

      // Link socket to WebRTC service
      webrtcServiceRef.current.socket = socketServiceRef.current.socket;

      // If there are other participants, create offer
      if (data.participants && data.participants.length > 1) {
        setTimeout(() => {
          webrtcServiceRef.current.createOffer();
        }, 1000);
      }
    };

    socketServiceRef.current.onUserJoined = async (data) => {
      console.log('User joined, creating offer...');
      
      // Wait a bit for the new user to set up their stream
      setTimeout(() => {
        webrtcServiceRef.current.createOffer();
      }, 1000);
    };

    socketServiceRef.current.onUserLeft = (data) => {
      console.log('User left');
      setRemoteStream(null);
    };

    socketServiceRef.current.onOffer = async (offer, socketId) => {
      await webrtcServiceRef.current.handleOffer(offer, socketId);
    };

    socketServiceRef.current.onAnswer = async (answer) => {
      await webrtcServiceRef.current.handleAnswer(answer);
    };

    socketServiceRef.current.onIceCandidate = async (candidate) => {
      await webrtcServiceRef.current.handleIceCandidate(candidate);
    };

    // Connect to socket server
    socketServiceRef.current.connect(roomId, userId);

    isInitializedRef.current = true;

    return () => {
      console.log('Cleaning up WebRTC hook');
      if (webrtcServiceRef.current) {
        webrtcServiceRef.current.cleanup();
      }
      if (socketServiceRef.current) {
        socketServiceRef.current.disconnect();
      }
      isInitializedRef.current = false;
    };
  }, [roomId, userId]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.toggleMute();
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.toggleVideo();
    }
  }, []);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (webrtcServiceRef.current) {
      await webrtcServiceRef.current.switchCamera();
    }
  }, []);

  // End call
  const endCall = useCallback(() => {
    if (socketServiceRef.current) {
      socketServiceRef.current.leaveRoom(roomId, userId);
    }
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.cleanup();
    }
    if (socketServiceRef.current) {
      socketServiceRef.current.disconnect();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [roomId, userId]);

  // Get state
  const getState = useCallback(() => {
    if (webrtcServiceRef.current) {
      return webrtcServiceRef.current.getState();
    }
    return {
      isMuted: false,
      isVideoEnabled: true,
      isFrontCamera: true,
      hasLocalStream: false,
      hasRemoteStream: false,
    };
  }, []);

  return {
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
  };
};

