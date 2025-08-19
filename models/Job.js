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
    enum: ['posted', 'applied', 'oa_round', 'interview', 'rejected', 'offer', 'ghosted'],
    default: 'posted'
  },
  datePosted: {
    type: Date,
    required: true
  },
  dateApplied: {
    type: Date,
    required: false
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
  },
  applicationUrl: {
    type: String,
    trim: true
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['posted', 'applied', 'oa_round', 'interview', 'rejected', 'offer', 'ghosted'],
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    emailId: {
      type: String,
      required: false
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: false
    },
    source: {
      type: String,
      enum: ['manual', 'email_automation', 'application_scraper'],
      default: 'manual'
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  emailHistory: [{
    emailId: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    sender: {
      type: String,
      required: true
    },
    receivedDate: {
      type: Date,
      required: true
    },
    emailLink: {
      type: String,
      required: false,
      trim: true
    },
    classification: {
      type: String,
      enum: ['application', 'assessment', 'interview', 'rejection', 'offer', 'unknown'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    statusUpdate: {
      type: String,
      enum: ['posted', 'applied', 'oa_round', 'interview', 'rejected', 'offer', 'ghosted'],
      required: false
    },
    processed: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// Update lastUpdated on save
jobSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Job', jobSchema);