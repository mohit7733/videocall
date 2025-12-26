import Call from '../models/Call.model.js';
import Room from '../models/Room.model.js';
// import { transcribeAudioFromUrl } from './whisper.service.js';
// import { summarizeConversation } from './gpt.service.js';
import { uploadFile } from './aws.service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new call/room
 */
export const createCall = async (userId, roomId = null) => {
  try {
    const newRoomId = roomId || uuidv4();
    
    // Create room
    const room = await Room.create({
      roomId: newRoomId,
      createdBy: userId,
      participants: [{ userId, socketId: null }],
      status: 'waiting'
    });

    // Create call record
    const call = await Call.create({
      roomId: newRoomId,
      participants: [userId],
      status: 'active'
    });

    return { room, call };
  } catch (error) {
    console.error('Create call error:', error);
    throw error;
  }
};

/**
 * Join an existing call
 */
export const joinCall = async (roomId, userId) => {
  try {
    const room = await Room.findOne({ roomId });
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.participants.length >= room.maxParticipants) {
      throw new Error('Room is full');
    }

    // Check if user is already a participant
    const isParticipant = room.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (!isParticipant) {
      room.participants.push({ userId, socketId: null });
      if (room.participants.length === room.maxParticipants) {
        room.status = 'active';
      }
      await room.save();
    }

    // Update call record
    let call = await Call.findOne({ roomId });
    if (!call) {
      call = await Call.create({
        roomId,
        participants: [userId],
        status: 'active'
      });
    } else {
      const isCallParticipant = call.participants.some(
        p => p.toString() === userId.toString()
      );
      if (!isCallParticipant) {
        call.participants.push(userId);
        await call.save();
      }
    }

    return { room, call };
  } catch (error) {
    console.error('Join call error:', error);
    throw error;
  }
};

/**
 * End a call
 */
export const endCall = async (roomId) => {
  try {
    const call = await Call.findOne({ roomId });
    if (!call) {
      throw new Error('Call not found');
    }

    call.status = 'ended';
    call.endedAt = new Date();
    call.duration = Math.floor((call.endedAt - call.startedAt) / 1000);

    await call.save();

    const room = await Room.findOne({ roomId });
    if (room) {
      room.status = 'ended';
      await room.save();
    }

    return call;
  } catch (error) {
    console.error('End call error:', error);
    throw error;
  }
};

/**
 * Process call recording: transcribe and summarize
 */
export const processCallRecording = async (roomId, audioBuffer, videoBuffer = null) => {
  try {
    const call = await Call.findOne({ roomId });
    if (!call) {
      throw new Error('Call not found');
    }

    call.status = 'processing';
    await call.save();

    // Upload audio to S3
    const audioFileName = `audio/${roomId}_${Date.now()}.mp3`;
    const audioUrl = await uploadFile(audioBuffer, audioFileName, 'audio/mpeg');
    call.audioUrl = audioUrl;

    // Upload video to S3 if provided
    if (videoBuffer) {
      const videoFileName = `video/${roomId}_${Date.now()}.mp4`;
      const videoUrl = await uploadFile(videoBuffer, videoFileName, 'video/mp4');
      call.videoUrl = videoUrl;
    }

    await call.save();

    // Transcribe audio using Whisper
    // const transcript = await transcribeAudioFromUrl(audioUrl);
    // call.transcript = transcript;
    // await call.save();

    // Summarize using GPT
    // const summary = await summarizeConversation(transcript);
    // call.summary = summary;
    // call.status = 'ended';
    // await call.save();

    return call;
  } catch (error) {
    console.error('Process call recording error:', error);
    // Update call status even if processing fails
    const call = await Call.findOne({ roomId });
    if (call) {
      call.status = 'ended';
      await call.save();
    }
    throw error;
  }
};

/**
 * Get user's call history
 */
export const getCallHistory = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const calls = await Call.find({
      participants: userId,
      status: 'ended'
    })
      .populate('participants', 'name email')
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Call.countDocuments({
      participants: userId,
      status: 'ended'
    });

    return {
      calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get call history error:', error);
    throw error;
  }
};

/**
 * Get call details by room ID
 */
export const getCallDetails = async (roomId, userId) => {
  try {
    // First check if room exists
    const room = await Room.findOne({ roomId });
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if user is a room participant
    const isRoomParticipant = room.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (!isRoomParticipant) {
      throw new Error('Unauthorized access to room');
    }

    // Try to find call, create if it doesn't exist
    let call = await Call.findOne({ roomId })
      .populate('participants', 'name email');

    if (!call) {
      // Create call record if it doesn't exist but room does
      call = await Call.create({
        roomId,
        participants: room.participants.map(p => p.userId),
        status: room.status === 'active' ? 'active' : 'waiting'
      });
      await call.populate('participants', 'name email');
    }

    return call;
  } catch (error) {
    console.error('Get call details error:', error);
    throw error;
  }
};

