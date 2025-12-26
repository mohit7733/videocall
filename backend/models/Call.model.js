import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoUser',
    required: true
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'processing'],
    default: 'active'
  },
  videoUrl: {
    type: String,
    default: null
  },
  audioUrl: {
    type: String,
    default: null
  },
  transcript: {
    type: String,
    default: null
  },
  summary: {
    overview: {
      type: String,
      default: null
    },
    keyPoints: [{
      type: String
    }],
    decisions: [{
      type: String
    }],
    actionItems: [{
      item: String,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VideoUser',
        default: null
      },
      dueDate: {
        type: Date,
        default: null
      }
    }]
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
callSchema.index({ participants: 1, createdAt: -1 });
callSchema.index({ status: 1 });

export default mongoose.model('Call', callSchema);

