# Database Schemas

This document outlines the MongoDB schemas used in the job tracking application.

## Job Schema (`models/Job.js`)

The primary schema for tracking job applications through their lifecycle.

### Core Fields
- **company** (String, required, trimmed) - Company name
- **position** (String, required, trimmed) - Job title/position
- **status** (String, enum, default: 'posted') - Current job status
  - Values: `posted`, `applied`, `oa_round`, `interview`, `rejected`, `offer`, `ghosted`
- **datePosted** (Date, required) - When the job was originally posted
- **dateApplied** (Date, optional) - When application was submitted
- **lastUpdated** (Date, auto-updated) - Last modification timestamp

### Optional Fields
- **emailThreadId** (String, unique, sparse) - Gmail thread ID for email association
- **notes** (String, trimmed) - User notes about the job
- **salaryRange** (String, trimmed) - Salary information
- **location** (String, trimmed) - Job location
- **applicationUrl** (String, trimmed) - Link to job posting or application

### Audit Trails

#### Status History Array
Complete audit trail of all status changes:
```javascript
statusHistory: [{
  status: String (enum), // Same values as main status field
  date: Date (default: now),
  emailId: String (optional), // Associated email that triggered change
  confidence: Number (0-1), // AI confidence in status classification
  source: String (enum, default: 'manual'), // 'manual', 'email_automation', 'application_scraper'
  notes: String (trimmed) // Optional notes about the change
}]
```

#### Email History Array
Complete record of all related emails:
```javascript
emailHistory: [{
  emailId: String (required), // Gmail message ID
  subject: String (required), // Email subject line
  sender: String (required), // Email sender address
  receivedDate: Date (required), // When email was received
  emailLink: String (optional, trimmed), // Link to email in Gmail
  classification: String (enum, required), // 'application', 'assessment', 'interview', 'rejection', 'offer', 'unknown'
  confidence: Number (0-1, required), // AI confidence in classification
  statusUpdate: String (enum, optional), // Status change triggered by this email
  processed: Boolean (default: true) // Whether email has been processed
}]
```

### Middleware
- **Pre-save hook**: Automatically updates `lastUpdated` field on every save

---

## Email Schema (`models/Email.js`)

Schema for storing and processing incoming emails before association with jobs.

### Core Fields
- **jobId** (ObjectId, ref: 'Job', optional) - Reference to associated job
- **emailId** (String, required, unique) - Gmail message ID
- **subject** (String, required, max: 500) - Email subject line
- **sender** (String, required) - Email sender address
- **content** (String, required) - Full email body content
- **receivedDate** (Date, required) - When email was received

### Processing Fields
- **processed** (Boolean, default: false) - Whether email has been processed
- **classification** (String, enum, default: 'unknown') - Email type classification
  - Values: `application`, `assessment`, `interview`, `rejection`, `offer`, `unknown`

### Indexes
Optimized for common query patterns:
- `emailId: 1` - Fast lookups by Gmail message ID
- `jobId: 1` - Fast queries for job-related emails
- `processed: 1` - Efficient filtering of unprocessed emails

### Timestamps
- **createdAt** - When record was created
- **updatedAt** - When record was last modified

---

## Relationships

- **One-to-Many**: Job → Email History (embedded in Job document)
- **One-to-Many**: Job → Email (via `jobId` reference in Email schema)
- Jobs can exist without associated emails
- Emails can exist without being associated to jobs (orphaned emails)

## Status Pipeline

Jobs follow a defined status progression:
```
posted → applied → oa_round → interview → rejected/offer/ghosted
```

Status changes are tracked in both:
1. The main `status` field (current state)
2. The `statusHistory` array (complete audit trail)