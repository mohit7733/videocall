import { useRef, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useWebRTC = (roomId, userId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoChunksRef = useRef([]);

  // WebRTC configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Create or get existing peer connection
  const getOrCreatePeerConnection = useCallback(() => {
    // Close existing connection if any
    if (peerConnectionRef.current) {
      console.log('Closing existing peer connection');
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    console.log('Creating new peer connection');
    const pc = new RTCPeerConnection(rtcConfiguration);

    // Add local stream tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind);
        pc.addTrack(track, localStreamRef.current);
      });
    } else {
      console.warn('Local stream not available when creating peer connection');
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      const remoteStream = event.streams[0];
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Peer connection state:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.warn('Peer connection failed or disconnected');
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        socketRef.current?.emit('ice-candidate', {
          roomId,
          candidate: event.candidate,
          targetSocketId: null
        });
      } else {
        console.log('ICE candidate gathering complete');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [roomId]);

  // Create offer
  const createOffer = useCallback(async () => {
    try {
      // Wait for local stream if not ready
      if (!localStreamRef.current) {
        console.log('Waiting for local stream...');
        await new Promise((resolve) => {
          const checkStream = setInterval(() => {
            if (localStreamRef.current) {
              clearInterval(checkStream);
              resolve();
            }
          }, 100);
          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkStream);
            resolve();
          }, 5000);
        });
      }

      if (!localStreamRef.current) {
        console.error('Local stream not available for creating offer');
        return;
      }

      const pc = getOrCreatePeerConnection();
      console.log('Creating offer...');
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      console.log('Offer created and set as local description');

      socketRef.current?.emit('offer', {
        roomId,
        offer,
        targetSocketId: null
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [roomId, getOrCreatePeerConnection]);

  // Handle offer
  const handleOffer = useCallback(async (offer, socketId) => {
    try {
      if (!offer) {
        console.error('No offer received');
        return;
      }

      // Wait for local stream if not ready
      if (!localStreamRef.current) {
        console.log('Waiting for local stream to handle offer...');
        await new Promise((resolve) => {
          const checkStream = setInterval(() => {
            if (localStreamRef.current) {
              clearInterval(checkStream);
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(checkStream);
            resolve();
          }, 5000);
        });
      }

      const pc = getOrCreatePeerConnection();
      console.log('Handling offer from:', socketId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(answer);
      console.log('Answer created and sent');

      socketRef.current?.emit('answer', {
        roomId,
        answer,
        targetSocketId: socketId
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [roomId, getOrCreatePeerConnection]);

  // Handle answer
  const handleAnswer = useCallback(async (answer) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (candidate) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!localStreamRef.current) return;

    audioChunksRef.current = [];
    videoChunksRef.current = [];

    // Record audio
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const audioStream = new MediaStream(audioTracks);
      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm'
      });

      audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      audioRecorder.start();
      mediaRecorderRef.current = audioRecorder;
    }

    setIsRecording(true);
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    // Don't initialize if userId is not available
    if (!userId || !roomId) {
      console.log('Waiting for userId or roomId...', { userId, roomId });
      return;
    }

    // Don't reinitialize if socket already exists and is connected
    if (socketRef.current && socketRef.current.connected) {
      console.log('Socket already connected, skipping initialization');
      return;
    }

    console.log('Initializing socket connection...', { roomId, userId });
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      socketRef.current.emit('join-room', { roomId, userId });
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('room-joined', (data) => {
      console.log('Room joined:', data);
      if (data.participants && data.participants.length > 1) {
        // Wait for local stream before creating offer
        const waitForStream = setInterval(() => {
          if (localStreamRef.current && localStreamRef.current.getTracks().length > 0) {
            clearInterval(waitForStream);
            console.log('Local stream ready, creating offer...');
            createOffer();
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(waitForStream);
          if (localStreamRef.current) {
            createOffer();
          }
        }, 5000);
      }
    });

    socketRef.current.on('user-joined', (data) => {
      console.log('User joined:', data);
      // Wait for local stream before creating offer
      const waitForStream = setInterval(() => {
        if (localStreamRef.current && localStreamRef.current.getTracks().length > 0) {
          clearInterval(waitForStream);
          console.log('Local stream ready, creating offer...');
          createOffer();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(waitForStream);
        if (localStreamRef.current) {
          createOffer();
        }
      }, 5000);
    });

    socketRef.current.on('offer', async (data) => {
      if (data.offer) {
        await handleOffer(data.offer, data.socketId);
      }
    });

    socketRef.current.on('answer', async (data) => {
      if (data.answer) {
        await handleAnswer(data.answer);
      }
    });

    socketRef.current.on('ice-candidate', async (data) => {
      if (data.candidate) {
        await handleIceCandidate(data.candidate);
      }
    });

    socketRef.current.on('user-left', (data) => {
      console.log('User left:', data);
      setRemoteStream(prev => {
        if (prev) {
          prev.getTracks().forEach(track => track.stop());
        }
        return null;
      });
    });

    socketRef.current.on('start-recording', () => {
      startRecording();
    });

    socketRef.current.on('stop-recording', () => {
      stopRecording();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId, userId });
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, [roomId, userId]); // Removed callback dependencies to prevent re-runs

  // Initialize local media stream
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        console.log('Requesting user media...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        
        console.log('User media obtained:', {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length
        });
        
        localStreamRef.current = stream;
        setLocalStream(stream);
        
        // Update video element when ref is available
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log('Local video element updated');
        } else {
          // Retry if ref not ready
          setTimeout(() => {
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              console.log('Local video element updated (delayed)');
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Failed to access camera/microphone. Please check permissions.');
      }
    };

    initLocalStream();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped local track on cleanup:', track.kind);
        });
        localStreamRef.current = null;
      }
    };
  }, []);

  // Get recorded audio blob
  const getRecordedAudio = useCallback(() => {
    if (audioChunksRef.current.length > 0) {
      return new Blob(audioChunksRef.current, { type: 'audio/webm' });
    }
    return null;
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    console.log('Cleaning up WebRTC resources...');
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped local track:', track.kind);
      });
      localStreamRef.current = null;
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped remote track:', track.kind);
      });
      setRemoteStream(null);
    }
    
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [remoteStream]);

  // Update video elements when streams change
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      console.log('Updated local video element with stream');
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log('Updated remote video element with stream');
    }
  }, [remoteStream]);

  return {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isConnected,
    isRecording,
    startRecording,
    stopRecording,
    getRecordedAudio,
    cleanup
  };
};

