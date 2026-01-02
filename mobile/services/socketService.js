import { io } from 'socket.io-client';
import { SOCKET_URL } from './webrtcService';

// ============================================
// Socket Service Class
// ============================================

class SocketService {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.userId = null;
    this.onConnect = null;
    this.onDisconnect = null;
    this.onError = null;
    this.onRoomJoined = null;
    this.onUserJoined = null;
    this.onUserLeft = null;
    this.onOffer = null;
    this.onAnswer = null;
    this.onIceCandidate = null;
  }

  // Connect to signaling server
  connect(roomId, userId) {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return;
    }

    this.roomId = roomId;
    this.userId = userId;

    console.log('Connecting to socket server:', SOCKET_URL);
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      if (this.onConnect) {
        this.onConnect();
      }
      // Join room after connection
      this.joinRoom(roomId, userId);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (this.onDisconnect) {
        this.onDisconnect(reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (this.onError) {
        this.onError('Failed to connect to server');
      }
    });

    // Room events
    this.socket.on('room-joined', (data) => {
      console.log('Room joined:', data);
      if (this.onRoomJoined) {
        this.onRoomJoined(data);
      }
    });

    this.socket.on('user-joined', (data) => {
      console.log('User joined:', data);
      if (this.onUserJoined) {
        this.onUserJoined(data);
      }
    });

    this.socket.on('user-left', (data) => {
      console.log('User left:', data);
      if (this.onUserLeft) {
        this.onUserLeft(data);
      }
    });

    // WebRTC signaling events
    this.socket.on('offer', async (data) => {
      console.log('Offer received:', data);
      if (data.offer && this.onOffer) {
        await this.onOffer(data.offer, data.socketId);
      }
    });

    this.socket.on('answer', async (data) => {
      console.log('Answer received:', data);
      if (data.answer && this.onAnswer) {
        await this.onAnswer(data.answer);
      }
    });

    this.socket.on('ice-candidate', async (data) => {
      console.log('ICE candidate received:', data);
      if (data.candidate && this.onIceCandidate) {
        await this.onIceCandidate(data.candidate);
      }
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (this.onError) {
        this.onError(error.message || 'Socket error occurred');
      }
    });
  }

  // Join room
  joinRoom(roomId, userId) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected, cannot join room');
      return;
    }

    console.log('Joining room:', { roomId, userId });
    this.socket.emit('join-room', { roomId, userId });
  }

  // Leave room
  leaveRoom(roomId, userId) {
    if (this.socket && this.socket.connected) {
      console.log('Leaving room:', { roomId, userId });
      this.socket.emit('leave-room', { roomId, userId });
    }
  }

  // Send offer
  sendOffer(offer, targetSocketId = null) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('offer', {
        roomId: this.roomId,
        offer,
        targetSocketId,
      });
    }
  }

  // Send answer
  sendAnswer(answer, targetSocketId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('answer', {
        roomId: this.roomId,
        answer,
        targetSocketId,
      });
    }
  }

  // Send ICE candidate
  sendIceCandidate(candidate, targetSocketId = null) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ice-candidate', {
        roomId: this.roomId,
        candidate,
        targetSocketId,
      });
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check if connected
  isConnected() {
    return this.socket && this.socket.connected;
  }
}

export default SocketService;

