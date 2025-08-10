const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['applied', 'oa_round', 'interview', 'rejected', 'offer', 'ghosted'],
    default: 'applied'
  },
  dateApplied: {
    type: Date,
    required: true,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  emailThreadId: {
    type: String,
    unique: true,
    sparse: true
  },
  notes: {
    type: String,
    trim: true
  },
  salaryRange: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Update lastUpdated on save
jobSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Job', jobSchema);