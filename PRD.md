# Job Tracker - Product Requirements Document

## Overview
A personal job application tracking system that automatically scrapes job application emails and displays them on a web dashboard with categorized statuses.

## Core Features

### 1. Email Scraping & Processing
- **Daily automated scraping** at 1 PM
- **Email pattern recognition** for job applications:
  - "Thank you for submitting your application"
  - "Updates on your application to"
  - "Your application for [position] at [company]"
  - "We received your application"
  - "Application status update"
- **Data extraction**:
  - Company name
  - Job title/position
  - Application date
  - Email content for status determination
  - Sender information

### 2. Job Status Categories
- **Applied**: Initial application submitted
- **OA Round**: Online Assessment/Coding Challenge
- **Interview**: Phone/Video/Onsite interviews scheduled
- **Rejected**: Application declined
- **Offer**: Job offer received
- **Ghosted**: No response after extended period

### 3. Web Dashboard
- **Kanban-style board** with drag-and-drop between categories
- **Job cards** displaying:
  - Company name and logo (if available)
  - Position title
  - Application date
  - Days since application
  - Last status update
- **Search and filter** functionality
- **Statistics panel**:
  - Total applications
  - Response rate
  - Applications by status
  - Monthly application trends

## Technical Architecture

### Frontend (React + Tailwind CSS)
- **Components**:
  - `JobBoard`: Main kanban board component
  - `JobCard`: Individual job application card
  - `StatusColumn`: Category columns (Applied, OA, Interview, etc.)
  - `Dashboard`: Statistics and overview
  - `SearchBar`: Filter and search functionality
- **State Management**: React Context or Redux Toolkit
- **Styling**: Tailwind CSS with custom components

### Backend (Node.js/Express)
- **Email Service**: 
  - Gmail API or IMAP integration
  - Email parsing and classification
  - Cron job for daily scraping (node-cron)
- **Database**: MongoDB Atlas (Cloud)
  - Jobs collection (company, position, status, dateApplied, etc.)
  - Emails collection (raw email data, processed status)
- **API Endpoints**:
  - `GET /jobs` - Fetch all jobs
  - `PUT /jobs/:id` - Update job status
  - `POST /jobs` - Manual job entry
  - `GET /stats` - Dashboard statistics

### Automation
- **Scheduler**: Daily cron job at 1 PM
- **Email Processing Pipeline**:
  1. Fetch new emails
  2. Parse and classify
  3. Extract job details
  4. Update database
  5. Handle duplicates

## Email Classification Rules

### Pattern Matching
```javascript
const emailPatterns = {
  application: [
    /thank you for (submitting|applying)/i,
    /we (have )?received your application/i,
    /your application (for|to)/i
  ],
  assessment: [
    /online assessment/i,
    /coding (challenge|test)/i,
    /technical assessment/i,
    /take.{0,20}assessment/i
  ],
  interview: [
    /interview/i,
    /schedule.{0,20}(call|meeting)/i,
    /next step/i
  ],
  rejection: [
    /unfortunately/i,
    /not moving forward/i,
    /decided not to proceed/i,
    /other candidates/i
  ]
}
```

## Data Model

### Jobs Collection (MongoDB)
```javascript
const jobSchema = {
  _id: ObjectId,
  company: String, // required, trimmed
  position: String, // required, trimmed
  status: String, // enum: ['applied', 'oa_round', 'interview', 'rejected', 'offer', 'ghosted']
  dateApplied: Date, // required, default: now
  lastUpdated: Date, // auto-updated on save
  emailThreadId: String, // unique, sparse
  notes: String,
  salaryRange: String,
  location: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Emails Collection (MongoDB)
```javascript
const emailSchema = {
  _id: ObjectId,
  jobId: ObjectId, // reference to Job document
  emailId: String, // unique, required
  subject: String, // required, max 500 chars
  sender: String, // required
  content: String, // required
  receivedDate: Date, // required
  processed: Boolean, // default: false
  classification: String, // enum: ['application', 'assessment', 'interview', 'rejection', 'offer', 'unknown']
  createdAt: Date,
  updatedAt: Date
}
```

## User Stories

1. **As a job seeker**, I want to see all my job applications in one place so I can track my progress
2. **As a user**, I want automatic email parsing so I don't manually enter every application
3. **As a user**, I want to categorize jobs by status so I can prioritize follow-ups
4. **As a user**, I want to see statistics about my job search so I can improve my strategy
5. **As a user**, I want to manually update job statuses when I get information outside of email

## Success Metrics
- 95%+ accuracy in email classification
- Daily automated processing without manual intervention
- Responsive web interface loading in <2 seconds
- Zero data loss in job tracking

## Development Phases

### Phase 1: MVP (Week 1-2)
- Basic email scraping setup
- Simple React dashboard with job cards
- Manual status updates
- MongoDB Atlas database setup

### Phase 2: Enhancement (Week 3)
- Automated email classification
- Drag-and-drop status updates
- Basic statistics
- Improved UI/UX

### Phase 3: Polish (Week 4)
- Advanced filtering and search
- Email thread tracking
- Company logos integration
- Mobile responsiveness
- Error handling and logging

## Technical Considerations
- **Email API limits**: Respect Gmail API quotas
- **Privacy**: Store emails securely, consider encryption
- **Error handling**: Graceful failures in email processing
- **Performance**: Pagination for large job lists
- **Backup**: Regular database backups