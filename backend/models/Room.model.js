import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoUser',
    required: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VideoUser'
    },
    socketId: {
      type: String,
      default: null
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended'],
    default: 'waiting'
  },
  maxParticipants: {
    type: Number,
    default: 5
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomSchema.index({ roomId: 1 });
roomSchema.index({ status: 1 });

export default mongoose.model('Room', roomSchema);

