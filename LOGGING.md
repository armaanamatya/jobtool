# JobTool Logging System

The JobTool scraper now includes comprehensive logging that creates organized log files every time it runs.

## Log Directory Structure

```
job_logs/
├── 2025-08-19_15.md                              # Main scrape log (date_jobcount)
├── posted_2025-08-19_10.md                      # 10 jobs posted on 2025-08-19
├── posted_2025-08-18_5.md                       # 5 jobs posted on 2025-08-18
├── scraping_summary.log                          # Simple summary log
└── ...
```

## Log File Types

### 1. Main Scrape Log
**Format**: `(date)_(amount_of_jobs).md`
**Example**: `2025-08-19_15.md`

Contains:
- Scraping timestamp and summary
- Jobs grouped by date posted
- Complete details of all jobs scraped
- Statistics (saved, duplicates, errors)

### 2. Date-Specific Job Logs
**Format**: `posted_(date_posted)_(amount_of_jobs).md`
**Example**: `posted_2025-08-19_15.md`

Contains:
- All jobs posted on a specific date
- Organized by the date the job was originally posted
- Separate file for each posting date found

### 3. Summary Log
**File**: `scraping_summary.log`

Contains:
- Simple timestamped entries
- Quick overview of each scrape run
- Easy to parse for monitoring

## Log Content

Each job entry includes:
- **Company name**
- **Position title**
- **Status** (posted, applied, etc.)
- **Date posted**
- **Location**
- **Salary range** (if available)
- **Application URL** (clickable link)
- **Job ID** (database reference)
- **Notes** (if any)

## Automatic Features

### 1. Scheduled Logging
- Runs automatically at 4 PM CDT daily
- Creates logs for all scraped jobs
- No manual intervention required

### 2. Organization by Date Posted
- Jobs are automatically grouped by their posting date
- Each posting date gets its own detailed file
- Easy to track which jobs were posted when

### 3. Cleanup
- Automatically removes log files older than 30 days
- Prevents disk space issues
- Runs during each scheduled scrape

## Manual Testing

To test the logging system manually:

```bash
# Option 1: Trigger through PM2 scheduler
pm2 status
# Type 'run' in the scheduler console

# Option 2: Manual scraper run
node scripts/runScraper.js
```

## Log File Examples

### Main Log File Structure
```markdown
# Job Scraping Log - 2025-08-19_15

## Scraping Summary
- **Timestamp**: Monday, August 19, 2025 at 4:00:00 PM CDT
- **Total Jobs Scraped**: 15
- **New Jobs Saved**: 12
- **Duplicates Skipped**: 3
- **Errors**: 0

## Jobs by Date Posted
- **2025-08-19**: 10 jobs
- **2025-08-18**: 5 jobs

## All Jobs Scraped
### 1. Google - Software Engineer
- **Company**: Google
- **Position**: Software Engineer
- **Status**: posted
- **Date Posted**: 8/19/2025
- **Location**: Mountain View, CA
- **Salary Range**: $120k - $180k
- **Application URL**: [Apply Here](https://simplify.jobs/...)
- **Job ID**: 12345...
```

## Monitoring

### Check Recent Logs
```bash
# List all log files
ls job_logs/

# View latest main log
ls job_logs/*_*.md | head -1 | xargs cat

# Check summary
tail job_logs/scraping_summary.log
```

### Log Locations
- **Main directory**: `C:/Users/armaa/OneDrive/Desktop/jobtool/job_logs/`
- **All logs are in Markdown format** for easy reading
- **Summary log in plain text** for automated parsing

## Benefits

1. **Organized by date**: Easy to see which jobs were posted when
2. **Detailed information**: Every job attribute captured
3. **Clickable links**: Direct access to application URLs
4. **Automatic cleanup**: No manual maintenance required
5. **Multiple formats**: Both detailed logs and summary data
6. **Searchable**: Markdown format works well with text search

The logging system provides complete visibility into what jobs are being scraped and when, making it easy to track the effectiveness of the scraping process and review historical data.