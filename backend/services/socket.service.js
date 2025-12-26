import Room from '../models/Room.model.js';
import Call from '../models/Call.model.js';

// Store active rooms and their WebRTC connections
const activeRooms = new Map();

export const initializeSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room
    socket.on('join-room', async (data) => {
      try {
        const { roomId, userId } = data;

        // Check if room exists
        const existingRoom = await Room.findOne({ roomId });
        if (!existingRoom) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is already a participant
        const participantExists = existingRoom.participants.some(
          p => p.userId.toString() === userId
        );

        if (!participantExists && existingRoom.participants.length < existingRoom.maxParticipants) {
          // Add new participant atomically (using findOneAndUpdate avoids version conflicts)
          const updatedRoom = await Room.findOneAndUpdate(
            { roomId },
            {
              $push: {
                participants: {
                  userId,
                  socketId: socket.id,
                  joinedAt: new Date()
                }
              }
            },
            { new: true }
          );

          // Update status if room is now full
          if (updatedRoom && updatedRoom.participants.length === updatedRoom.maxParticipants) {
            await Room.findOneAndUpdate(
              { roomId },
              { $set: { status: 'active' } }
            );
          }
        } else if (participantExists) {
          // Update socket ID if user already exists (atomic)
          await Room.findOneAndUpdate(
            { roomId, 'participants.userId': userId },
            {
              $set: {
                'participants.$.socketId': socket.id
              }
            }
          );
        }

        socket.join(roomId);

        // Store room info
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, {
            participants: new Set(),
            connections: new Map()
          });
        }
        activeRooms.get(roomId).participants.add(socket.id);

        // Notify others in room
        socket.to(roomId).emit('user-joined', {
          socketId: socket.id,
          userId
        });

        // Send existing participants to new user
        try {
          const roomData = await Room.findOne({ roomId }).populate('participants.userId', 'name email');
          socket.emit('room-joined', {
            roomId,
            participants: roomData.participants.map(p => ({
              userId: p.userId?._id || p.userId,
              socketId: p.socketId,
              name: p.userId?.name || 'Unknown'
            }))
          });
        } catch (populateError) {
          console.error('Error populating room data:', populateError);
          // Send room-joined even if populate fails
          const roomData = await Room.findOne({ roomId });
          socket.emit('room-joined', {
            roomId,
            participants: roomData.participants.map(p => ({
              userId: p.userId,
              socketId: p.socketId,
              name: 'Unknown'
            }))
          });
        }

        console.log(`User ${userId} joined room ${roomId}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // WebRTC signaling - Offer
    socket.on('offer', (data) => {
      const { roomId, offer, targetSocketId } = data;
      socket.to(targetSocketId || roomId).emit('offer', {
        offer,
        socketId: socket.id
      });
    });

    // WebRTC signaling - Answer
    socket.on('answer', (data) => {
      const { roomId, answer, targetSocketId } = data;
      socket.to(targetSocketId || roomId).emit('answer', {
        answer,
        socketId: socket.id
      });
    });

    // WebRTC signaling - ICE Candidate
    socket.on('ice-candidate', (data) => {
      const { roomId, candidate, targetSocketId } = data;
      socket.to(targetSocketId || roomId).emit('ice-candidate', {
        candidate,
        socketId: socket.id
      });
    });

    // Start recording
    socket.on('start-recording', async (data) => {
      try {
        const { roomId } = data;
        socket.to(roomId).emit('start-recording', { roomId });
      } catch (error) {
        console.error('Start recording error:', error);
      }
    });

    // Stop recording
    socket.on('stop-recording', async (data) => {
      try {
        const { roomId } = data;
        socket.to(roomId).emit('stop-recording', { roomId });
      } catch (error) {
        console.error('Stop recording error:', error);
      }
    });

    // Audio chunk received
    socket.on('audio-chunk', async (data) => {
      try {
        const { roomId, audioData, timestamp } = data;
        // Forward to other participants if needed
        socket.to(roomId).emit('audio-chunk', {
          audioData,
          timestamp,
          socketId: socket.id
        });
      } catch (error) {
        console.error('Audio chunk error:', error);
      }
    });

    // Leave room
    socket.on('leave-room', async (data) => {
      try {
        const { roomId, userId } = data;

        // Remove from room atomically
        const updatedRoom = await Room.findOneAndUpdate(
          { roomId },
          {
            $pull: {
              participants: { socketId: socket.id }
            }
          },
          { new: true }
        );

        // Update status if no participants left
        if (updatedRoom && updatedRoom.participants.length === 0) {
          await Room.findOneAndUpdate(
            { roomId },
            { $set: { status: 'ended' } }
          );
        }

        // Remove from active rooms
        if (activeRooms.has(roomId)) {
          activeRooms.get(roomId).participants.delete(socket.id);
          if (activeRooms.get(roomId).participants.size === 0) {
            activeRooms.delete(roomId);
          }
        }

        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          userId
        });

        socket.leave(roomId);
        console.log(`User ${userId} left room ${roomId}`);
      } catch (error) {
        console.error('Leave room error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Clean up rooms
      for (const [roomId, roomData] of activeRooms.entries()) {
        if (roomData.participants.has(socket.id)) {
          roomData.participants.delete(socket.id);
          
          // Update room in database atomically
          const updatedRoom = await Room.findOneAndUpdate(
            { roomId },
            {
              $pull: {
                participants: { socketId: socket.id }
              }
            },
            { new: true }
          );

          // Update status if no participants left
          if (updatedRoom && updatedRoom.participants.length === 0) {
            await Room.findOneAndUpdate(
              { roomId },
              { $set: { status: 'ended' } }
            );
          }

          socket.to(roomId).emit('user-left', { socketId: socket.id });
          
          if (roomData.participants.size === 0) {
            activeRooms.delete(roomId);
          }
        }
      }
    });
  });
};

