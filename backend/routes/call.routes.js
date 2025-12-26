import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createRoom,
  joinRoom,
  endCall,
  uploadRecording,
  getCallHistory,
  getCallDetails
} from '../controllers/call.controller.js';
import { uploadToS3 } from '../services/aws.service.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/create', createRoom);
router.post('/join/:roomId', joinRoom);
router.post('/end/:roomId', endCall);
// router.post('/upload-recording', uploadToS3.fields([
//   { name: 'audio', maxCount: 1 },
//   { name: 'video', maxCount: 1 }
// ]), uploadRecording);
// router.get('/history', getCallHistory);
router.get('/:roomId', getCallDetails);

export default router;

