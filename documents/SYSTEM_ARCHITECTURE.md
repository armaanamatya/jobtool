# JobTool System Architecture & Program Flow

## Overview

JobTool is an automated job application tracking system that scrapes job postings from SWEList emails and monitors Gmail for application status updates. The system consists of three main components that work together to provide comprehensive job tracking automation.

## Program Architecture & Entry Points

The program has 3 main components that can run independently:

### 1. Backend API Server
- **File**: `server.js:1-28`
- **Purpose**: Express.js API server
- **Port**: 3001
- **Function**: Provides REST API for frontend job management

### 2. Daily Scheduler
- **File**: `scripts/startScheduler.js:1-76`
- **Purpose**: Cron-based job scraping
- **Schedule**: Daily at 4:00 PM CDT
- **Function**: Automatically scrapes new jobs from SWEList emails

### 3. Email Monitor
- **File**: `scripts/startEmailMonitor.js:1-55`
- **Purpose**: Real-time Gmail monitoring
- **Frequency**: Every 30 minutes
- **Function**: Monitors for application status updates

## Startup & Automation

### Process Management
- **PM2 Configuration**: `ecosystem.config.js:1-37` - Production deployment configuration
- **Auto-Startup Setup**: `setup-autostart.bat:1-47` - Installs PM2 as Windows service
- **Manual Startup**: `start-jobtool.bat:1-15` - Manual startup script for both server and scheduler

### Scheduled Execution
- **Cron Scheduler**: `services/cronScheduler.js:25-34` - Runs daily at 4:00 PM CDT using node-cron
- **Direct Scheduler**: `start_scheduler.bat:1-6` - Direct scheduler execution

## Gmail API Integration & Scheduling

### Main Scheduler Flow
1. **Initialization**: `services/cronScheduler.js:13-46` - Initializes EmailScraper and schedules daily runs
2. **Daily Trigger**: `services/cronScheduler.js:48-80` - Daily scrape triggers `scraper.scrapeAndReport(1)`
3. **Email Fetching**: `services/emailScraper.js:18-82` - Fetches SWEList emails via `gmailService.getSWEListEmails(daysBack)`

### Gmail Service
- **Authentication**: Uses Google OAuth2 with credentials in `client_secret_*.json`
- **Token Storage**: Token stored in `token.json`
- **Service File**: `services/gmailService.js` - Handles Gmail authentication and email fetching

## SWEList Job Scraping Process

### Email Processing Pipeline
1. **Fetch Emails** - `services/emailScraper.js:23` gets emails from last N days
2. **Parse Jobs** - `services/jobParser.js:5-97` extracts job data from email HTML
3. **Deduplicate** - `services/jobParser.js:218-233` removes internal duplicates
4. **Save to DB** - `services/jobService.js:19-59` checks for database duplicates

### SWEList Parsing Logic (`services/jobParser.js`)

#### Primary Pattern (lines 12-42)
```html
<p class="internship"><strong>Company:</strong> <a href="...">Position</a></p>
```

#### Fallback Pattern (lines 45-90)
- Generic link extraction with company:position text patterns
- Used when primary pattern fails

#### Data Extracted
- Company name
- Position title
- Application URL
- Posting date

## Duplicate Detection & Differentiation

### Two-Level Duplicate Detection System

#### 1. In-Memory Deduplication (`services/jobParser.js:218-233`)
```javascript
const key = `${job.company.toLowerCase()}_${job.position.toLowerCase()}_${job.location || 'no-location'}`;
```
- **Considers**: Company + Position + Location
- **Result**: Same company/position but different locations = **Different Jobs**

#### 2. Database Duplicate Check (`services/jobService.js:34-44`)
```javascript
const existingJob = await Job.findOne({
  company: jobData.company,
  position: jobData.position,
  applicationUrl: jobData.applicationUrl
});
```
- **Uses**: Company + Position + Application URL
- **Result**: More restrictive - same company/position with different URLs = Different Jobs

### Key Differentiation Rules
- **Same company + position + different location** → **Separate jobs** (allowed by in-memory deduplication)
- **Same company + position + different application URL** → **Separate jobs** (allowed by database check)
- **Identical company + position + URL** → **Duplicate** (rejected)

## Email Status Monitoring

### Automated Status Updates (`services/emailMonitor.js`)
- **Frequency**: Runs every 30 minutes
- **Function**: Checks for job-related emails (excluding SWEList promotional emails)
- **Pipeline**:
  1. **Classification**: `services/emailClassifier.js` classifies email types (rejection, interview, etc.)
  2. **Matching**: `services/jobMatcher.js` matches emails to existing jobs
  3. **Updates**: `services/statusUpdater.js` updates job status automatically

### Email Filtering
- **Excluded Senders**: noreply@swelist.com, LinkedIn notifications, Indeed, Glassdoor
- **Job Keywords**: application, interview, position, role, job, offer, assessment, etc.
- **Recruiting Domains**: greenhouse.io, lever.co, workday.com, etc.

## Data Model

### Job Schema (`models/Job.js:3-128`)

#### Status Pipeline
```
posted → applied → oa_round → interview → rejected/offer/ghosted
```

#### Key Fields
- **Core Info**: company, position, status, datePosted, applicationUrl
- **Tracking**: statusHistory, emailHistory for audit trail
- **Unique Constraints**: Optional emailThreadId for email association

#### Status History Tracking
- Maintains complete audit trail of status changes
- Includes confidence scores and source attribution
- Links status changes to specific emails

## Complete Program Flow

### Daily Automated Cycle
1. **4:00 PM CDT**: Cron scheduler activates
2. **Gmail Fetch**: Retrieves SWEList emails from past 24 hours
3. **HTML Parsing**: Extracts job data (company/position/URL) from email HTML
4. **Internal Deduplication**: Removes duplicates by company+position+location key
5. **Database Check**: Verifies against existing company+position+URL combinations
6. **Database Save**: Stores new unique jobs with 'posted' status
7. **Logging**: Creates detailed logs in `job_logs/` directory

### Continuous Monitoring
- **Every 30 minutes**: Email monitor scans for job-related emails
- **Status Classification**: Determines email type and confidence score
- **Job Matching**: Associates emails with existing job applications
- **Automatic Updates**: Updates job status based on email content

## File Structure

### Core Services
- `services/cronScheduler.js` - Daily scheduling logic
- `services/emailScraper.js` - SWEList email processing
- `services/emailMonitor.js` - Real-time email monitoring
- `services/gmailService.js` - Gmail API integration
- `services/jobParser.js` - Job data extraction and deduplication
- `services/jobService.js` - Database operations
- `services/emailClassifier.js` - Email type classification
- `services/jobMatcher.js` - Email-to-job matching
- `services/statusUpdater.js` - Automated status updates

### Scripts & Entry Points
- `scripts/startScheduler.js` - Scheduler entry point
- `scripts/startEmailMonitor.js` - Email monitor entry point
- `scripts/runScraper.js` - Manual scraper execution
- `server.js` - API server entry point

### Models
- `models/Job.js` - MongoDB job schema
- `models/Email.js` - Email tracking model

### Batch Files (Windows)
- `setup-autostart.bat` - Production setup with PM2
- `start-jobtool.bat` - Manual startup
- `start_scheduler.bat` - Scheduler-only startup
- `auto_scheduler.bat` - Alternative scheduler startup

## System Design Philosophy

The system is architected to:

1. **Differentiate Valid Variations**: Same company with different locations/roles are treated as separate opportunities
2. **Prevent True Duplicates**: Identical company+position+URL combinations are rejected
3. **Maintain Audit Trail**: All status changes and email interactions are logged
4. **Operate Autonomously**: Runs with minimal user intervention once configured
5. **Handle Failures Gracefully**: Includes error handling and retry logic
6. **Scale Efficiently**: Uses MongoDB for flexible data storage and PM2 for process management

This architecture ensures reliable job tracking while minimizing false positives in duplicate detection, allowing you to capture legitimate job variations while avoiding database clutter.