# Email Status Monitoring System

## Overview
Automated email monitoring system that tracks job application status updates by analyzing incoming emails and updating job statuses in real-time.

## Architecture

### Core Components
- **Email Monitor Service**: Continuous Gmail API monitoring with push notifications
- **Email Classifier**: AI-powered text analysis for status detection
- **Job Matcher**: Email-to-job correlation engine
- **Status Updater**: Automated database updates
- **Email Logger**: Processing logs and audit trail

### Status Detection Patterns

#### Rejected
- Keywords: `unfortunately`, `not moving forward`, `not selected`, `regret to inform`
- Phrases: `we have decided to move forward with other candidates`
- Sender patterns: `noreply@`, `talent@`, `hr@`

#### Online Assessment (OA Round)
- Keywords: `online assessment`, `coding challenge`, `technical assessment`, `hackerrank`
- Phrases: `complete the following assessment`, `coding test`
- Links: HackerRank, CodeSignal, Karat URLs

#### Interview
- Keywords: `interview invitation`, `schedule an interview`, `next round`, `phone screen`
- Phrases: `would like to schedule`, `moving to the next step`
- Calendar invites and Calendly links

#### Offer
- Keywords: `congratulations`, `offer`, `we are pleased`, `welcome to the team`
- Phrases: `extend an offer`, `job offer`, `compensation package`

#### Ghosted (Passive Detection)
- No response after 14+ days from application
- No response after 7+ days from interview
- Automatic status update based on time thresholds

## Email-to-Job Matching Logic

### Primary Matching Criteria
1. **Company Domain Matching**: Extract domain from sender email
2. **Company Name in Content**: Parse email body for company references
3. **Position Title Matching**: Extract job titles from subject/body
4. **Timeline Correlation**: Match with recently applied jobs (last 30 days)

### Confidence Scoring
- **High Confidence (90-100%)**: Exact company + position match
- **Medium Confidence (70-89%)**: Company match + partial position match
- **Low Confidence (50-69%)**: Company match only
- **Manual Review (<50%)**: Ambiguous matches require human verification

## Service Implementation

### Gmail API Integration
```javascript
// Real-time push notifications
const gmailWatch = {
  labelIds: ['INBOX'],
  topicName: 'projects/jobtool/topics/gmail-notifications'
};

// Email processing pipeline
processNewEmail(email) → classifyEmail() → matchToJob() → updateStatus() → logResult()
```

### Database Schema Updates
```javascript
// Add email tracking to Job model
emailThreadId: String,        // Gmail thread ID
emailHistory: [{
  date: Date,
  status: String,
  emailSubject: String,
  confidence: Number,
  processed: Boolean
}]
```

## Auto-startup Configuration

### PM2 Process Management
```javascript
// ecosystem.config.js addition
{
  name: 'email-monitor',
  script: 'services/emailMonitor.js',
  watch: false,
  autorestart: true,
  max_restarts: 10
}
```

### Windows Task Scheduler
- **Trigger**: At startup + every hour
- **Action**: PM2 restart email-monitor
- **Conditions**: Run only if network available

## Processing Flow

### Real-time Monitoring
1. Gmail push notification received
2. Fetch new email content via Gmail API
3. Filter for job-related emails (exclude newsletters, social, etc.)
4. Extract sender, subject, and body content
5. Classify email type using pattern matching + AI
6. Match email to existing job applications
7. Update job status if confidence > 70%
8. Log processing result and send notification

### Batch Processing (Startup)
1. Scan last 7 days of emails on service start
2. Process any missed emails during downtime
3. Update job statuses for found matches
4. Generate summary report of updates

## Error Handling & Logging

### Email Processing Logs
```
logs/email_processing/
├── YYYY-MM-DD_email_monitor.log
├── YYYY-MM-DD_status_updates.log
└── YYYY-MM-DD_errors.log
```

### Log Format
```
[TIMESTAMP] [LEVEL] [EMAIL_ID] [COMPANY] [STATUS] [CONFIDENCE] - MESSAGE
2025-08-19T10:30:00.000Z INFO email_123 Google rejected 95% - Status updated: posted → rejected
```

### Fallback Mechanisms
- **API Rate Limits**: Exponential backoff and queuing
- **Network Issues**: Offline queue with retry logic
- **Classification Errors**: Manual review queue for low confidence matches
- **Database Failures**: Local cache with sync on recovery

## Security & Privacy

### Data Protection
- **OAuth 2.0**: Secure Gmail API access with minimal permissions
- **Email Content**: Process in memory only, no persistent storage
- **Credentials**: Environment variables and encrypted storage
- **Audit Trail**: All status updates logged with source email

### Permissions Required
- `gmail.readonly`: Read email content
- `gmail.modify`: Mark emails as processed (optional)
- `pubsub.subscriber`: Receive push notifications

## Future Enhancements

### Advanced Features
- **ML Classification**: Train custom model on job-related emails
- **Multi-platform Support**: Outlook, Yahoo Mail integration
- **Smart Notifications**: Desktop alerts for status changes
- **Analytics Dashboard**: Status update trends and response times
- **Email Templates**: Auto-reply to certain types of emails

### Integration Possibilities
- **Calendar Integration**: Auto-schedule interviews from email invites
- **CRM Sync**: Export data to external job tracking tools
- **Slack/Discord Notifications**: Real-time status updates
- **Browser Extension**: Inline status updates while browsing emails