import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
} from 'react-native-webrtc';

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// Backend/Signaling Server URL
// Update this to match your backend URL
export const SOCKET_URL = 'https://vcxtv1pq-5000.inc1.devtunnels.ms';

// STUN/TURN Servers
// Update these if you have custom STUN/TURN servers
export const RTC_CONFIGURATION = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add your TURN servers here if needed:
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'your-username',
    //   credential: 'your-password'
    // }
  ],
  iceCandidatePoolSize: 10,
};

// ============================================
// WebRTC Service Class
// ============================================

class WebRTCService {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.socket = null;
    this.roomId = null;
    this.userId = null;
    this.isFrontCamera = true;
    this.isMuted = false;
    this.isVideoEnabled = true;
    this.onLocalStream = null;
    this.onRemoteStream = null;
    this.onConnectionStateChange = null;
    this.onError = null;
  }

  // Initialize local media stream
  async initializeLocalStream() {
    try {
      console.log('Requesting media permissions...');
      
      // Request camera and microphone permissions
      const stream = await mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: this.isFrontCamera ? 'user' : 'environment',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('Media stream obtained:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });

      this.localStream = stream;
      
      if (this.onLocalStream) {
        this.onLocalStream(stream);
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      if (this.onError) {
        this.onError('Failed to access camera/microphone. Please check permissions.');
      }
      throw error;
    }
  }

  // Switch camera (front/back)
  async switchCamera() {
    if (!this.localStream) {
      console.warn('No local stream available for camera switch');
      return;
    }

    try {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (!videoTrack) {
        console.warn('No video track found');
        return;
      }

      // Switch camera facing mode
      this.isFrontCamera = !this.isFrontCamera;
      
      // Stop current track
      videoTrack.stop();
      
      // Get new stream with opposite camera
      const newStream = await mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: this.isFrontCamera ? 'user' : 'environment',
        },
        audio: false, // Keep existing audio track
      });

      // Replace video track in local stream
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = this.peerConnection?.getSenders().find(
        (s) => s.track && s.track.kind === 'video'
      );

      if (sender && newVideoTrack) {
        await sender.replaceTrack(newVideoTrack);
      }

      // Update local stream
      this.localStream.removeTrack(videoTrack);
      this.localStream.addTrack(newVideoTrack);
      
      // Stop the temporary stream (we only needed the track)
      newStream.getTracks().forEach(track => {
        if (track.kind === 'video') {
          // Track is now in localStream, don't stop it
        } else {
          track.stop();
        }
      });

      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }

      console.log('Camera switched to:', this.isFrontCamera ? 'front' : 'back');
    } catch (error) {
      console.error('Error switching camera:', error);
      if (this.onError) {
        this.onError('Failed to switch camera');
      }
    }
  }

  // Toggle mute/unmute
  toggleMute() {
    if (!this.localStream) {
      return;
    }

    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      this.isMuted = !this.isMuted;
      audioTracks.forEach((track) => {
        track.enabled = !this.isMuted;
      });
      console.log('Audio muted:', this.isMuted);
    }
  }

  // Toggle video on/off
  toggleVideo() {
    if (!this.localStream) {
      return;
    }

    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      this.isVideoEnabled = !this.isVideoEnabled;
      videoTracks.forEach((track) => {
        track.enabled = this.isVideoEnabled;
      });
      console.log('Video enabled:', this.isVideoEnabled);
    }
  }

  // Create or get existing peer connection
  getOrCreatePeerConnection() {
    if (this.peerConnection) {
      return this.peerConnection;
    }

    console.log('Creating new RTCPeerConnection');
    this.peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);

    // Add local stream tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        console.log('Adding track to peer connection:', track.kind);
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      const remoteStream = event.streams[0];
      this.remoteStream = remoteStream;
      
      if (this.onRemoteStream) {
        this.onRemoteStream(remoteStream);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Peer connection state:', this.peerConnection.connectionState);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    // Handle ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        console.log('Sending ICE candidate');
        this.socket.emit('ice-candidate', {
          roomId: this.roomId,
          candidate: event.candidate,
          targetSocketId: null,
        });
      } else {
        console.log('ICE candidate gathering complete');
      }
    };

    return this.peerConnection;
  }

  // Create offer
  async createOffer() {
    try {
      // Wait for local stream if not ready
      if (!this.localStream) {
        console.log('Waiting for local stream...');
        await this.initializeLocalStream();
      }

      if (!this.localStream) {
        console.error('Local stream not available for creating offer');
        return;
      }

      const pc = this.getOrCreatePeerConnection();
      console.log('Creating offer...');
      
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await pc.setLocalDescription(offer);
      console.log('Offer created and set as local description');

      if (this.socket) {
        this.socket.emit('offer', {
          roomId: this.roomId,
          offer,
          targetSocketId: null,
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      if (this.onError) {
        this.onError('Failed to create offer');
      }
    }
  }

  // Handle offer
  async handleOffer(offer, socketId) {
    try {
      if (!offer) {
        console.error('No offer received');
        return;
      }

      // Wait for local stream if not ready
      if (!this.localStream) {
        console.log('Waiting for local stream to handle offer...');
        await this.initializeLocalStream();
      }

      const pc = this.getOrCreatePeerConnection();
      console.log('Handling offer from:', socketId);
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await pc.setLocalDescription(answer);
      console.log('Answer created and sent');

      if (this.socket) {
        this.socket.emit('answer', {
          roomId: this.roomId,
          answer,
          targetSocketId: socketId,
        });
      }
    } catch (error) {
      console.error('Error handling offer:', error);
      if (this.onError) {
        this.onError('Failed to handle offer');
      }
    }
  }

  // Handle answer
  async handleAnswer(answer) {
    try {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log('Answer received and set as remote description');
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      if (this.onError) {
        this.onError('Failed to handle answer');
      }
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(candidate) {
    try {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        console.log('ICE candidate added');
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Cleanup resources
  cleanup() {
    console.log('Cleaning up WebRTC resources...');

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
        console.log('Stopped local track:', track.kind);
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        track.stop();
        console.log('Stopped remote track:', track.kind);
      });
      this.remoteStream = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get current state
  getState() {
    return {
      isMuted: this.isMuted,
      isVideoEnabled: this.isVideoEnabled,
      isFrontCamera: this.isFrontCamera,
      hasLocalStream: !!this.localStream,
      hasRemoteStream: !!this.remoteStream,
    };
  }
}

export default WebRTCService;

