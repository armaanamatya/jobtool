const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: false
  },
  emailId: {
    type: String,
    required: true,
    unique: true
  },
  subject: {
    type: String,
    required: true,
    maxlength: 500
  },
  sender: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  receivedDate: {
    type: Date,
    required: true
  },
  processed: {
    type: Boolean,
    default: false
  },
  classification: {
    type: String,
    enum: ['application', 'assessment', 'interview', 'rejection', 'offer', 'unknown'],
    default: 'unknown'
  }
}, {
  timestamps: true
});

// Index for faster queries
emailSchema.index({ emailId: 1 });
emailSchema.index({ jobId: 1 });
emailSchema.index({ processed: 1 });

module.exports = mongoose.model('Email', emailSchema);