# AI-Powered Video Conversation Platform

A production-grade SaaS application for 1-to-1 AI-powered video conversations with automatic transcription and summarization.

## Features

- 🎥 **1-to-1 Video Calls**: WebRTC-based peer-to-peer video and audio streaming
- 🎙️ **Recording**: Automatic recording of entire conversations
- 🤖 **AI Transcription**: OpenAI Whisper for speech-to-text conversion
- 📝 **AI Summarization**: GPT-powered conversation summaries with:
  - Overview
  - Key Points
  - Decisions
  - Action Items
- 📊 **Call History**: View past calls with transcripts and summaries
- 🔐 **Authentication**: JWT-based secure authentication
- ☁️ **Cloud Storage**: AWS S3 integration for audio/video storage

## Tech Stack

### Frontend
- React 18 (Vite)
- Tailwind CSS
- Socket.IO Client
- WebRTC API

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- WebRTC Signaling
- OpenAI API (Whisper + GPT-4)
- AWS S3

## Project Structure

```
├── backend/
│   ├── controllers/      # Request handlers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/       # Auth middleware
│   ├── utils/            # Utility functions
│   └── server.js         # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/   # React components
    │   ├── contexts/     # React contexts
    │   ├── hooks/        # Custom hooks
    │   ├── pages/        # Page components
    │   └── utils/        # Utility functions
    └── vite.config.js
```

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- AWS Account with S3 bucket
- OpenAI API key

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/videocall

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name

OPENAI_API_KEY=your-openai-api-key
```

5. Start MongoDB (if running locally):
```bash
mongod
```

6. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Room**: Click "Create New Room" to start a new video call
3. **Join Room**: Enter a room ID to join an existing call
4. **Video Call**: 
   - Allow camera and microphone permissions
   - Wait for the other participant to join
   - Use controls to mute/unmute audio/video
5. **End Call**: Click the end call button to stop recording and process the conversation
6. **View History**: Access call history to see transcripts and AI-generated summaries

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Calls
- `POST /api/calls/create` - Create new call room (protected)
- `POST /api/calls/join/:roomId` - Join existing room (protected)
- `POST /api/calls/end/:roomId` - End call (protected)
- `POST /api/calls/upload-recording` - Upload recording for processing (protected)
- `GET /api/calls/history` - Get call history (protected)
- `GET /api/calls/:roomId` - Get call details (protected)

## WebRTC Signaling Events

### Client → Server
- `join-room` - Join a room
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `ice-candidate` - Send ICE candidate
- `leave-room` - Leave room
- `start-recording` - Start recording
- `stop-recording` - Stop recording

### Server → Client
- `room-joined` - Room joined confirmation
- `user-joined` - Another user joined
- `user-left` - User left the room
- `offer` - Receive WebRTC offer
- `answer` - Receive WebRTC answer
- `ice-candidate` - Receive ICE candidate

## Security Considerations

- JWT tokens for authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation with express-validator
- Protected routes with authentication middleware

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure proper CORS origins
4. Use MongoDB Atlas or managed MongoDB
5. Set up AWS S3 bucket with proper permissions
6. Use environment variables for all secrets
7. Enable HTTPS for WebRTC
8. Consider using TURN servers for better connectivity

## License

MIT

