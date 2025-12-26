import * as callService from '../services/call.service.js';
import { uploadToS3 } from '../services/aws.service.js';

export const createRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user._id;

    const { room, call } = await callService.createCall(userId, roomId);

    res.status(201).json({
      message: 'Room created successfully',
      room: {
        roomId: room.roomId,
        status: room.status,
        maxParticipants: room.maxParticipants
      },
      call: {
        roomId: call.roomId,
        status: call.status,
        startedAt: call.startedAt
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: error.message || 'Failed to create room' });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const { room, call } = await callService.joinCall(roomId, userId);

    res.json({
      message: 'Joined room successfully',
      room: {
        roomId: room.roomId,
        status: room.status,
        participants: room.participants.length
      },
      call: {
        roomId: call.roomId,
        status: call.status
      }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: error.message || 'Failed to join room' });
  }
};

export const endCall = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    // Verify user is participant
    const call = await callService.getCallDetails(roomId, userId);
    
    await callService.endCall(roomId);

    res.json({
      message: 'Call ended successfully'
    });
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ error: error.message || 'Failed to end call' });
  }
};

export const uploadRecording = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user._id;

    // Verify user is participant
    await callService.getCallDetails(roomId, userId);

    const audioFile = req.files?.audio?.[0];
    const videoFile = req.files?.video?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    // Process recording (transcribe and summarize)
    const call = await callService.processCallRecording(
      roomId,
      audioFile.buffer,
      videoFile?.buffer
    );

    res.json({
      message: 'Recording processed successfully',
      call: {
        roomId: call.roomId,
        transcript: call.transcript,
        summary: call.summary,
        audioUrl: call.audioUrl,
        videoUrl: call.videoUrl
      }
    });
  } catch (error) {
    console.error('Upload recording error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload recording' });
  }
};

export const getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await callService.getCallHistory(userId, page, limit);

    res.json(result);
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({ error: error.message || 'Failed to get call history' });
  }
};

export const getCallDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const call = await callService.getCallDetails(roomId, userId);

    res.json({ call });
  } catch (error) {
    console.error('Get call details error:', error);
    
    // Return appropriate status codes
    if (error.message === 'Room not found' || error.message === 'Call not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Unauthorized access to room' || error.message === 'Unauthorized access to call') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || 'Failed to get call details' });
  }
};

