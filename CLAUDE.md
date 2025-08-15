# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JobTool is a job application tracking system that automatically scrapes job postings from multiple sources and tracks application lifecycle through email monitoring. The system combines React frontend with Node.js/Express backend and MongoDB for data persistence.

## Development Commands

```bash
# Frontend development
npm start          # Start React development server
npm run build      # Build production bundle  
npm test           # Run React tests

# Backend (when implemented)
node server.js     # Start Express server
```

## Architecture Overview

### Frontend Structure
- **React 19.1.1** with TypeScript and Tailwind CSS
- **Component hierarchy:** JobBoard → StatusFilterSidebar + DateFilter + JobCard grid
- **State management:** React useState hooks (no external state library)
- **Drag & drop:** @dnd-kit for job card interactions
- **Responsive design:** Tailwind utility classes with mobile-first approach

### Backend Structure  
- **Express 5.1.0** server with MongoDB/Mongoose 8.17.1
- **Automated scraping:** node-cron for scheduled tasks
- **Data sources:** SWEList emails (noreply@swelist.com) + GitHub repos (SimplifyJobs, vanshb03)
- **Email processing:** Planned integration for application status tracking

### Data Models

**Job Interface:**
```typescript
interface Job {
  _id: string;
  company: string;
  position: string;
  status: 'posted' | 'applied' | 'oa_round' | 'interview' | 'rejected' | 'offer' | 'ghosted';
  datePosted: string;
  dateApplied?: string;
  lastUpdated: string;
  emailThreadId?: string;
  notes?: string;
  salaryRange?: string;
  location?: string;
}
```

**Status Flow:** posted → applied → oa_round → interview → (offer|rejected|ghosted)

## Key Implementation Details

### Status Management
- **STATUS_CONFIG** in `StatusFilterSidebar.tsx` defines display colors and labels
- **Job statuses** must be updated in both JobBoard arrays and StatusFilterSidebar config
- **Color coding:** Each status has specific Tailwind color classes (bg-{color}-100, text-{color}-800, border-{color}-300)

### Component Communication
- **JobBoard** manages all state and passes handlers down to child components
- **Filtering** implemented via useMemo with status and date range conditions
- **Mock data** currently used (MOCK_JOBS) until backend integration

### Database Integration
- **MongoDB schemas** defined in `/models/` for Job and Email entities
- **Job model** includes `datePosted` (required) and `dateApplied` (optional) to separate posting date from application date
- **Email processing** designed to update job statuses automatically
- **Database connection** configured via environment variables (`MONGODB_URI`)

## Current Development Status

**Implemented:**
- Complete React frontend with filtering and drag-and-drop
- MongoDB models and Express server foundation
- TypeScript type definitions

**Pending Implementation:**
- API routes for CRUD operations
- Email scraping and parsing logic
- GitHub repository scraping
- Automated cron job scheduling
- Backend-frontend integration
- TypeScript configuration file (tsconfig.json)

## Data Sources and Automation Goals

**Primary Sources:**
- SWEList email notifications (noreply@swelist.com)
- GitHub repos: SimplifyJobs/Summer2026-Internships, vanshb03/Summer2026-Internships
- Email monitoring for application status updates (OA invitations, rejections, offers)

**Automation Features:**
- Daily scraping of new job postings
- Automatic email parsing for application lifecycle tracking  
- Date filtering for posted dates, application dates, and status change dates

## Environment Setup

**Required Environment Variables:**
- `MONGODB_URI` - MongoDB connection string for database access

**Missing Configuration:**
- TypeScript configuration file (`tsconfig.json`) needs to be created for proper TypeScript compilation
- Environment variables file (`.env`) should be configured for local development