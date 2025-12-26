# Quick Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (local installation or MongoDB Atlas account)
3. **AWS Account** with S3 bucket created
4. **OpenAI API Key** (for Whisper and GPT)

## Step-by-Step Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/videocall
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/videocall

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name

OPENAI_API_KEY=your-openai-api-key
```

Start MongoDB (if running locally):
```bash
mongod
```

Start backend server:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file in `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Start frontend development server:
```bash
npm run dev
```

### 3. AWS S3 Configuration

1. Create an S3 bucket in your AWS account
2. Configure bucket permissions:
   - Enable public read access for uploaded files (or use signed URLs)
   - Set CORS configuration to allow requests from your frontend domain
3. Create IAM user with S3 access permissions
4. Get access key ID and secret access key
5. Add them to backend `.env` file

### 4. OpenAI Configuration

1. Sign up at https://platform.openai.com/
2. Create an API key
3. Add it to backend `.env` file as `OPENAI_API_KEY`
4. Ensure you have credits in your OpenAI account

## Testing the Application

1. **Start both servers** (backend and frontend)
2. **Open browser** to `http://localhost:5173`
3. **Register** a new account
4. **Create a room** or **join an existing room**
5. **Open another browser/incognito window** and register/login with a different account
6. **Join the same room** from the second browser
7. **Test video call** functionality
8. **End the call** to trigger transcription and summarization
9. **View call history** to see the transcript and AI-generated summary

## Troubleshooting

### WebRTC Connection Issues
- Ensure both users are on the same network or use TURN servers
- Check browser console for WebRTC errors
- Verify camera/microphone permissions are granted

### MongoDB Connection Issues
- Verify MongoDB is running (if local)
- Check MongoDB connection string in `.env`
- Ensure network access is configured (if using Atlas)

### AWS S3 Upload Issues
- Verify AWS credentials are correct
- Check S3 bucket permissions
- Ensure bucket name matches `.env` configuration

### OpenAI API Issues
- Verify API key is valid
- Check account has sufficient credits
- Review API rate limits

### Socket.IO Connection Issues
- Verify backend server is running
- Check CORS configuration
- Ensure frontend URL matches backend configuration

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, unique `JWT_SECRET`
3. Configure proper CORS origins
4. Use MongoDB Atlas or managed MongoDB
5. Set up AWS S3 with proper IAM roles
6. Use environment variables for all secrets
7. Enable HTTPS (required for WebRTC in production)
8. Consider using TURN servers (e.g., Twilio, Xirsys) for better connectivity
9. Set up proper logging and monitoring
10. Configure rate limiting and security headers

## Notes

- WebRTC requires HTTPS in production (except localhost)
- Audio format: WebM is recorded, but Whisper supports multiple formats
- For production, consider using a media server (e.g., Kurento, Janus) for better scalability
- Implement proper error handling and retry logic for API calls
- Add input validation and sanitization
- Consider implementing rate limiting for API endpoints

