# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + TypeScript)
- `npm start` - Start React development server on port 3000
- `npm run build` - Build React app for production
- `npm test` - Run React tests
- `start_dev.bat` - Start both frontend and backend servers in development mode

### Backend (Express.js)
- `npm run server` - Start Express API server on port 3001
- `node server.js` - Direct server startup

### Job Scraping & Monitoring
- `npm run scraper` - Run one-time job scraper
- `npm run scheduler` - Start daily job scheduler (4:00 PM CDT)
- `node scripts/startEmailMonitor.js` - Start Gmail email monitoring

### Production Deployment
- `pm2 start ecosystem.config.js` - Start all services with PM2
- `setup-autostart.bat` - Install PM2 as Windows service for auto-startup
- `start-jobtool.bat` - Manual startup of server and scheduler

## System Architecture

This is a full-stack job application tracking system with three main components:

1. **React Frontend** (`src/`) - TypeScript-based UI with drag-and-drop job management
2. **Express API Server** (`server.js`) - REST API on port 3001
3. **Automated Job Processing** - Daily scraping and email monitoring services

### Key Services

- **Job Scraping**: `services/emailScraper.js` fetches SWEList emails via Gmail API and `services/jobParser.js` extracts job data
- **Email Monitoring**: `services/emailMonitor.js` monitors Gmail every 30 minutes for status updates
- **Job Matching**: `services/jobMatcher.js` associates incoming emails with existing job applications
- **Status Updates**: `services/statusUpdater.js` automatically updates job status based on email content

### Database Schema

Jobs use MongoDB with status pipeline: `posted → applied → oa_round → interview → rejected/offer/ghosted`

Key fields in `models/Job.js`:
- Core: company, position, status, datePosted, applicationUrl
- Tracking: statusHistory, emailHistory (complete audit trail)
- Optional: emailThreadId for email association

### Duplicate Detection

Two-level system prevents duplicates while allowing valid job variations:
1. **In-memory**: Uses company+position+location key (allows same company/position with different locations)
2. **Database**: Uses company+position+applicationUrl (allows same company/position with different URLs)

### Gmail Integration

- Uses OAuth2 with credentials in `client_secret_*.json`
- Token stored in `token.json`
- Daily scraping at 4:00 PM CDT via `services/cronScheduler.js`
- Real-time monitoring every 30 minutes

### Process Management

PM2 configuration in `ecosystem.config.js` runs three processes:
- `jobtool-server` - API server
- `jobtool-scheduler` - Daily job scraping (restarts daily at midnight)
- `jobtool-email-monitor` - Gmail monitoring (restarts every 6 hours)

## Important Patterns

- All job data flows through `services/jobService.js` for database operations
- Email classification uses keyword matching in `services/emailClassifier.js`
- Frontend uses drag-and-drop with @dnd-kit for status management
- Logging outputs to `job_logs/` directory with date-stamped files
- Error handling includes retry logic and graceful degradation

## MongoDB Connection

Database operations auto-connect via `services/jobService.js:connectDatabase()`
- Default: `mongodb://localhost:27017/jobtool`
- Override with `MONGODB_URI` environment variable