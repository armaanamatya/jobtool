# Services & Scripts Documentation

This document outlines the structure and functionality of the `/scripts/` and `/services/` directories in the JobTool codebase.

## 📁 `/scripts/` - Automation & Testing Scripts

The scripts directory contains automation tools and production scripts for running the job tracking system.

### Main Production Scripts

#### **`runScraper.js`**
- **Purpose**: Main email scraper that processes SWEList emails and saves jobs to database
- **Usage**: `node scripts/runScraper.js [days]`
- **Features**:
  - Scrapes SWEList emails from specified number of days back
  - Extracts job postings using JobParser
  - Saves new jobs to MongoDB via JobService
  - Provides detailed logging and summary statistics
  - Handles duplicates and errors gracefully

#### **`startScheduler.js`**
- **Purpose**: Cron scheduler that runs the scraper daily at 4 PM CDT
- **Usage**: `node scripts/startScheduler.js`
- **Features**:
  - Schedules daily scraping at 4:00 PM CDT (21:00 UTC)
  - Handles graceful shutdown on SIGINT/SIGTERM
  - Provides manual trigger commands for testing
  - Interactive command interface (run, status, quit)

#### **`startEmailMonitor.js`**
- **Purpose**: Real-time email monitoring service for job status updates
- **Usage**: `node scripts/startEmailMonitor.js`
- **Features**:
  - Monitors Gmail for job-related emails every 30 minutes
  - Classifies emails (rejection, interview, OA, offer, etc.)
  - Matches emails to existing applied jobs
  - Automatically updates job status based on email content
  - Handles graceful shutdown and error recovery

### One-Time Data Import Scripts

#### **`oneTimeApplicationScraper.js`**
- **Purpose**: Scrapes application confirmation emails from Gmail (June-August 2025) to auto-discover applied jobs
- **Usage**: `node scripts/oneTimeApplicationScraper.js`
- **Features**:
  - Searches Gmail for application confirmation emails
  - Extracts company and position information from email content
  - Creates job records with status 'applied' and dateApplied timestamp
  - Avoids duplicates by checking existing applied jobs
  - Generates comprehensive summary reports

#### **`authenticate.js`**
- **Purpose**: Gmail OAuth authentication setup
- **Usage**: `node scripts/authenticate.js`
- **Features**:
  - Sets up Gmail API credentials
  - Generates OAuth tokens for Gmail access
  - Required for first-time setup

## 📁 `/testing/` - Testing & Debug Scripts

The testing directory contains all test scripts and debugging tools (moved from `/scripts/` for better organization).

### Test Scripts

#### **`testGmail.js`**
- **Purpose**: Test Gmail API connection and email fetching
- **Usage**: `node testing/testGmail.js`
- **Features**:
  - Tests Gmail service initialization
  - Fetches sample SWEList emails
  - Validates email parsing functionality

#### **`testJobParser.js`**
- **Purpose**: Test job parsing from SWEList emails
- **Usage**: `node testing/testJobParser.js`
- **Features**:
  - Tests HTML parsing of SWEList emails
  - Validates job extraction logic
  - Tests deduplication functionality

#### **`testJobServiceDirectly.js`**
- **Purpose**: Test database operations
- **Usage**: `node testing/testJobServiceDirectly.js`
- **Features**:
  - Tests MongoDB connection
  - Validates CRUD operations
  - Tests job statistics calculation

#### **`testScraperNoDb.js`**
- **Purpose**: Test scraper without database connection
- **Usage**: `node testing/testScraperNoDb.js`
- **Features**:
  - Tests email fetching and parsing
  - Validates job extraction without saving
  - Useful for debugging parsing issues

#### **`testEmailMonitor.js`**
- **Purpose**: Test email classification and job matching pipeline
- **Usage**: `node testing/testEmailMonitor.js`
- **Features**:
  - Tests email classification accuracy
  - Validates job matching logic
  - Tests status update functionality

#### **`testApiRoutes.js`**
- **Purpose**: Test API endpoints
- **Usage**: `node testing/testApiRoutes.js`
- **Features**:
  - Tests REST API functionality
  - Validates route handlers
  - Tests data serialization

### Debug Scripts

#### **`debugApplicationScraper.js`**
- **Purpose**: Debug tool to test Gmail search queries for application emails
- **Usage**: `node testing/debugApplicationScraper.js`
- **Features**:
  - Tests Gmail search queries
  - Validates email filtering logic
  - Helps debug application email detection

#### **`examineEmail.js`**
- **Purpose**: Debug tool to examine SWEList email structure
- **Usage**: `node testing/examineEmail.js`
- **Features**:
  - Analyzes email HTML structure
  - Saves sample emails for inspection
  - Helps debug parsing issues

## 📁 `/services/` - Core Business Logic

The services directory contains the core business logic and reusable components.

### Email Services

#### **`gmailService.js`**
- **Purpose**: Gmail API wrapper for fetching and parsing emails
- **Key Methods**:
  - `initialize()` - Sets up Gmail API authentication
  - `searchEmails(query, maxResults)` - Searches Gmail with custom queries
  - `getSWEListEmails(daysBack)` - Fetches SWEList emails specifically
  - `extractEmailMetadata(emailData)` - Extracts headers and metadata
  - `extractEmailBody(emailData)` - Parses HTML and text content

#### **`emailScraper.js`**
- **Purpose**: Main scraper that processes SWEList emails and extracts jobs
- **Key Methods**:
  - `initialize()` - Sets up Gmail service
  - `scrapeRecentEmails(daysBack)` - Main scraping logic
  - `scrapeAndReport(daysBack)` - Scraping with statistics
  - `close()` - Cleanup connections

#### **`emailMonitor.js`**
- **Purpose**: Real-time email monitoring for status updates
- **Key Methods**:
  - `start()` - Starts monitoring service
  - `stop()` - Stops monitoring service
  - `performInitialScan()` - Scans last 7 days of emails
  - `scanForNewEmails()` - Checks for new emails every 30 minutes
  - `processEmail(email)` - Processes individual emails through pipeline

#### **`emailClassifier.js`**
- **Purpose**: AI classification of emails (rejection, interview, OA, offer, etc.)
- **Key Methods**:
  - `classify(email)` - Classifies email type and confidence
  - `extractCompanyName(content, isATS)` - Extracts company from email
  - `extractPositionTitle(content)` - Extracts position from email
  - `hasRelevantKeywords(content, job)` - Checks for job-related keywords

### Job Management Services

#### **`jobService.js`**
- **Purpose**: Database operations for jobs (CRUD, stats, filtering)
- **Key Methods**:
  - `saveJobs(jobs)` - Saves multiple jobs with duplicate checking
  - `getJobs(filters)` - Retrieves jobs with optional filtering
  - `getJobStats()` - Calculates job statistics and response rates
  - `updateJobStatus(jobId, newStatus)` - Updates individual job status
  - `deleteJob(jobId)` - Removes job from database

#### **`jobParser.js`**
- **Purpose**: Parses job data from SWEList email HTML
- **Key Methods**:
  - `parseJobsFromEmail(emailBody, emailDate)` - Main parsing logic
  - `parseJobText(text)` - Text-based job parsing
  - `deduplicateJobs(jobs)` - Removes duplicate jobs
  - `cleanText(text)` - Cleans extracted text

#### **`jobMatcher.js`**
- **Purpose**: Matches emails to existing jobs in database
- **Key Methods**:
  - `findMatch(email, classification)` - Finds best job match
  - `findCandidateJobs(companyName, positionTitle)` - Gets potential matches
  - `calculateConfidence(job, emailData)` - Calculates match confidence
  - `isExactCompanyMatch(jobCompany, emailCompany)` - Company matching logic

#### **`statusUpdater.js`**
- **Purpose**: Updates job status based on email classification
- **Key Methods**:
  - `updateJobStatus(jobMatch)` - Main status update logic
  - `performStatusUpdate(job, newStatus, email, confidence)` - Database update
  - `logForManualReview(email, jobMatch)` - Logs low-confidence matches
  - `isValidTransition(currentStatus, newStatus)` - Validates status changes

### Infrastructure Services

#### **`cronScheduler.js`**
- **Purpose**: Schedules daily scraping runs
- **Key Methods**:
  - `start()` - Starts cron scheduler
  - `runDailyScrape()` - Executes daily scraping
  - `runManualScrape()` - Manual trigger for testing
  - `stop()` - Stops scheduler

#### **`jobLogger.js`**
- **Purpose**: Logging system for scraping results and monitoring
- **Key Methods**:
  - `logScrapingResults(jobs, summary)` - Creates detailed job logs
  - `logSummary(summary)` - Creates summary logs
  - `cleanupOldLogs()` - Removes old log files
  - `log(message, data)` - General purpose logging
  - `error(message, error, data)` - Error logging

## 🔄 System Workflow

### Daily Automated Workflow
1. **`startScheduler.js`** runs **`cronScheduler.js`**
2. **Scheduler** triggers **`emailScraper.js`** daily at 4 PM CDT
3. **Scraper** uses **`gmailService.js`** to fetch SWEList emails
4. **`jobParser.js`** extracts job data from emails
5. **`jobService.js`** saves new jobs to MongoDB

### Real-time Monitoring Workflow
1. **`startEmailMonitor.js`** runs **`emailMonitor.js`**
2. **Monitor** uses **`gmailService.js`** to check for new emails every 30 minutes
3. **`emailClassifier.js`** classifies email types (rejection, interview, etc.)
4. **`jobMatcher.js`** finds matching jobs in database
5. **`statusUpdater.js`** updates job status automatically

### One-time Data Import
1. **`oneTimeApplicationScraper.js`** searches Gmail for application confirmations
2. **Extracts** company and position information from email content
3. **Creates** job records with status 'applied' and proper timestamps
4. **Avoids** duplicates by checking existing applied jobs

## 🧪 Testing Strategy

All test scripts are organized in the `/testing/` directory:

- **Unit Tests**: Test individual services in isolation
- **Integration Tests**: Test service interactions
- **Debug Tools**: Help diagnose parsing and matching issues
- **API Tests**: Validate REST endpoints

## 📊 Key Features

- **Automated Job Discovery**: Scrapes SWEList emails daily
- **Real-time Status Updates**: Monitors email for status changes
- **Intelligent Matching**: AI-powered email-to-job matching
- **Comprehensive Logging**: Detailed logs for debugging and analysis
- **Duplicate Prevention**: Smart deduplication logic
- **Error Handling**: Robust error recovery and logging
- **Flexible Filtering**: Advanced job search and filtering
- **Statistics Tracking**: Response rates and application metrics

This system provides a complete solution for tracking job applications from discovery through the entire hiring process.
