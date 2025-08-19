# Email Status Monitoring Implementation Plan

## Current State Analysis ✅

**Strong Foundation Already Exists:**
- Complete Gmail OAuth2 authentication with active tokens
- Robust email fetching and parsing infrastructure 
- Production database with 374+ jobs and email tracking fields
- Automated scheduling with PM2 and cron

**What's Missing:**
- Real-time email monitoring for application status updates
- Email classification for rejections/interviews/offers
- Automated job status updates based on email content

## Implementation Plan

### Phase 1: Core Email Monitoring (2-3 days)

**1.1 EmailMonitor Service** 
- Create `services/emailMonitor.js` to scan for application-related emails
- Leverage existing `GmailService` to fetch emails from last 7 days
- Filter for job-related emails (exclude SWEList, newsletters, social)

**1.2 Email Classification Patterns**
- Pattern matching for rejection keywords (`unfortunately`, `not moving forward`)
- Interview invitation detection (`schedule an interview`, Calendly links) 
- OA detection (`online assessment`, `coding challenge`, HackerRank URLs)
- Offer detection (`congratulations`, `offer`, `compensation`)

**1.3 Basic Email-to-Job Matching**
- Company domain extraction from sender emails (e.g., `hr@google.com` → `google.com`)
- Direct domain matching with job company names
- ATS platform detection (Greenhouse, Lever, Workday) with content analysis
- Company name matching in email content for recruiting platforms
- Position title correlation with applied jobs

### Phase 2: Automated Updates (2-3 days)

**2.1 Job Matching with Confidence Scoring**
- High confidence (95%+): Exact company name + position title match
- Medium confidence (85-94%): Company email domain + timeline correlation
- Auto-update for confidence >85%, manual review queue for <85%

**2.2 Status Update Service**
- Automated transitions: `applied` → `rejected`/`interview`/`oa_round`/`offer`
- Update `lastUpdated` timestamps and add email history
- Preserve audit trail of all status changes

**2.3 Email Processing Pipeline**
- `processIncomingEmail()` → `classifyEmail()` → `matchToJob()` → `updateStatus()`
- Comprehensive logging for all processing steps
- Error handling for ambiguous matches

### Phase 3: Real-time Integration (1-2 days)

**3.1 Automated Background Monitoring**
- Add EmailMonitor to PM2 ecosystem configuration
- Periodic scanning (every 30 minutes) for new emails
- Integration with existing cron scheduler

**3.2 Enhanced Features**
- Manual review interface for low-confidence matches
- Email processing statistics and success rates
- Notification system for status changes

## Database Schema Updates

```javascript
// Job model enhancements - Updated with email tracking and status history
statusHistory: [{
  status: String,               // New status applied
  date: Date,                   // When status changed
  emailId: String,              // Email that triggered change
  confidence: Number,           // Match confidence (0-1)
  source: String,               // 'manual', 'email_automation', 'application_scraper'
  notes: String                 // Additional context
}],

emailHistory: [{
  emailId: String,              // Gmail message ID
  subject: String,              // Email subject line
  sender: String,               // Sender email address
  receivedDate: Date,           // When email was received
  emailLink: String,            // Gmail web link to email
  classification: String,       // 'rejection', 'interview', 'offer', etc.
  confidence: Number,           // Classification confidence (0-1)
  statusUpdate: String,         // Status change triggered (if any)
  processed: Boolean            // Whether email was processed
}]
```

## File Structure

```
services/
├── emailMonitor.js      # Main monitoring service (NEW)
├── emailClassifier.js   # Status pattern matching (NEW)  
├── jobMatcher.js        # Email-to-job correlation (NEW)
├── statusUpdater.js     # Automated status updates (NEW)
├── gmailService.js      # Existing - will be extended
└── cronScheduler.js     # Existing - will add email monitoring
```

## Implementation Priority

**Week 1 Focus:**
1. EmailMonitor service foundation
2. Basic pattern matching for common statuses
3. Simple company-based job matching
4. Manual status update workflow

**Week 2 Focus:**  
1. Confidence scoring and automated updates
2. PM2 integration for background processing
3. Comprehensive testing with real emails

## Technical Implementation Details

### EmailMonitor Service Architecture

```javascript
class EmailMonitor {
  constructor() {
    this.gmailService = new GmailService();
    this.classifier = new EmailClassifier();
    this.jobMatcher = new JobMatcher();
    this.statusUpdater = new StatusUpdater();
  }

  async scanForStatusUpdates() {
    // Fetch emails from last 7 days
    // Filter for job-related emails
    // Process each email through classification pipeline
    // Update job statuses based on matches
  }

  async processEmail(email) {
    const classification = await this.classifier.classify(email);
    const jobMatch = await this.jobMatcher.findMatch(email, classification);
    
    if (jobMatch.confidence >= 0.85) {
      await this.statusUpdater.updateJob(jobMatch);
    } else {
      await this.logForManualReview(email, jobMatch);
    }
  }
}
```

### Email Classification Patterns

```javascript
const CLASSIFICATION_PATTERNS = {
  rejected: {
    keywords: ['unfortunately', 'not moving forward', 'not selected', 'regret to inform'],
    phrases: ['decided to move forward with other candidates', 'will not be moving forward'],
    confidence: 0.9
  },
  interview: {
    keywords: ['interview invitation', 'schedule an interview', 'next round', 'phone screen'],
    phrases: ['would like to schedule', 'moving to the next step'],
    urls: ['calendly.com', 'acuityscheduling.com'],
    confidence: 0.85
  },
  oa_round: {
    keywords: ['online assessment', 'coding challenge', 'technical assessment'],
    phrases: ['complete the following assessment', 'coding test'],
    urls: ['hackerrank.com', 'codesignal.com', 'karat.com'],
    confidence: 0.9
  },
  offer: {
    keywords: ['congratulations', 'offer', 'we are pleased', 'welcome to the team'],
    phrases: ['extend an offer', 'job offer', 'compensation package'],
    confidence: 0.95
  }
};
```

### Job Matching Logic

```javascript
class JobMatcher {
  async findMatch(email, classification) {
    const senderDomain = this.extractDomainFromEmail(email.sender); // google.com
    const isATS = this.isATSPlatform(senderDomain); // greenhouse.io, lever.co, etc.
    
    const companyName = this.extractCompanyName(email.content, isATS);
    const positionTitle = this.extractPositionTitle(email.content);
    
    // Query jobs with status 'applied' from last 30 days
    const candidateJobs = await this.findCandidateJobs(companyName, positionTitle);
    
    return this.calculateBestMatch(candidateJobs, {
      senderDomain,
      companyName, 
      positionTitle,
      classification,
      isATS
    });
  }

  extractDomainFromEmail(email) {
    // hr@google.com → google.com
    return email.split('@')[1]?.toLowerCase();
  }

  isATSPlatform(domain) {
    const atsPlatforms = [
      'greenhouse.io',
      'lever.co', 
      'workday.com',
      'myworkdayjobs.com',
      'smartrecruiters.com',
      'bamboohr.com',
      'icims.com',
      'successfactors.com'
    ];
    return atsPlatforms.includes(domain);
  }

  calculateConfidence(job, emailData) {
    let confidence = 0;
    
    // Exact company name match: +50 points (required for high confidence)
    if (this.isExactCompanyMatch(job.company, emailData.companyName)) {
      confidence += 0.5;
    }
    
    // Exact position title match: +45 points (high confidence = 95%+)
    if (this.isExactPositionMatch(job.position, emailData.positionTitle)) {
      confidence += 0.45;
    }
    
    // Company email domain match: +40 points (medium confidence)
    // Direct match: hr@google.com matches job at "Google"
    if (!emailData.isATS && this.isCompanyDomainMatch(job.company, emailData.senderDomain)) {
      confidence += 0.4;
    }
    
    // ATS platform with company name in content: +35 points
    if (emailData.isATS && this.isExactCompanyMatch(job.company, emailData.companyName)) {
      confidence += 0.35;
    }
    
    // Timeline correlation: +15 points (recent application)
    if (this.isRecentApplication(job.dateApplied, 30)) { // 30 days
      confidence += 0.15;
    }
    
    // Keywords in email content: +10 points
    if (this.hasRelevantKeywords(emailData.content, job)) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  isCompanyDomainMatch(jobCompany, senderDomain) {
    // Google ↔ google.com, Microsoft ↔ microsoft.com
    const normalizedCompany = jobCompany.toLowerCase().replace(/\s+/g, '');
    const domainName = senderDomain.split('.')[0]; // google.com → google
    
    return normalizedCompany === domainName || 
           normalizedCompany.includes(domainName) ||
           domainName.includes(normalizedCompany);
  }
}
```

### PM2 Configuration Update

```javascript
// ecosystem.config.js - Add email monitoring process
{
  name: 'jobtool-email-monitor',
  script: 'services/emailMonitor.js',
  env: {
    NODE_ENV: 'production'
  },
  restart_delay: 10000,
  max_restarts: 5,
  min_uptime: '1m',
  cron_restart: '*/30 * * * *' // Restart every 30 minutes for fresh monitoring
}
```

## Testing Strategy

### Unit Testing
- Email classification accuracy with sample emails
- Job matching logic with known company/position pairs
- Status update workflows for each transition type

### Integration Testing  
- End-to-end email processing pipeline
- Database updates and audit trail validation
- Error handling for edge cases and malformed emails

### User Acceptance Testing
- Manual review interface for ambiguous matches
- Status update notifications and logging
- Performance testing with high email volumes

This builds directly on your excellent existing Gmail infrastructure and should provide immediate value for tracking application status changes automatically.