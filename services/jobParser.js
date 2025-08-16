const cheerio = require('cheerio');

class JobParser {
  
  parseJobsFromEmail(emailBody, emailDate) {
    const jobs = [];
    
    try {
      // Load HTML content
      const $ = cheerio.load(emailBody.html || emailBody.text);
      
      // SWEList specific pattern: <p class="internship"><strong>Company:</strong> <a href="...">Position</a></p>
      const internshipParagraphs = $('p.internship');
      
      internshipParagraphs.each((index, element) => {
        const $p = $(element);
        const $company = $p.find('strong');
        const $link = $p.find('a[href*="simplify.jobs"]');
        
        if ($company.length > 0 && $link.length > 0) {
          const company = $company.text().replace(':', '').trim();
          const position = $link.text().trim();
          const applicationUrl = $link.attr('href');
          
          if (company && position && applicationUrl) {
            // Clean up position title
            const cleanPosition = position.replace(/^(Intern|Internship)[\s-]*/, '').trim() || position;
            
            const job = {
              company: this.cleanText(company),
              position: this.cleanText(cleanPosition),
              status: 'posted',
              datePosted: emailDate,
              applicationUrl: applicationUrl,
              location: null,
              salaryRange: null
            };
            
            jobs.push(job);
          }
        }
      });
      
      // Fallback: Look for any Simplify links that weren't caught above
      if (jobs.length === 0) {
        const allLinks = $('a[href*="simplify.jobs"]');
        
        allLinks.each((index, element) => {
          const $link = $(element);
          const href = $link.attr('href');
          const linkText = $link.text().trim();
          
          // Skip the promotional Simplify link
          if (href && !href.includes('copilot') && linkText && linkText !== 'Link to Simplify') {
            
            // Try to find company name in parent or nearby text
            const $parent = $link.parent();
            const parentText = $parent.text();
            
            // Look for pattern "Company: Position" in parent text
            const match = parentText.match(/^(.*?):\s*(.+)$/);
            if (match) {
              const company = match[1].trim();
              const position = linkText;
              
              const job = {
                company: this.cleanText(company),
                position: this.cleanText(position),
                status: 'posted',
                datePosted: emailDate,
                applicationUrl: href,
                location: null,
                salaryRange: null
              };
              
              jobs.push(job);
            }
          }
        });
      }
      
    } catch (error) {
      console.error('Error parsing jobs from email:', error.message);
    }
    
    return jobs;
  }
  
  parseJobText(text) {
    // Common patterns in SWEList emails:
    // "Company Name: Position Title"
    // "Company Name - Position Title"
    // "Position Title at Company Name"
    
    let company = '';
    let position = '';
    let location = null;
    let salary = null;
    
    // Pattern 1: "Company: Position"
    const colonPattern = /^(.+?):\s*(.+)$/;
    const colonMatch = text.match(colonPattern);
    if (colonMatch) {
      company = colonMatch[1].trim();
      position = colonMatch[2].trim();
    }
    
    // Pattern 2: "Company - Position"
    const dashPattern = /^(.+?)\s*-\s*(.+)$/;
    const dashMatch = text.match(dashPattern);
    if (dashMatch && !company) {
      company = dashMatch[1].trim();
      position = dashMatch[2].trim();
    }
    
    // Pattern 3: "Position at Company"
    const atPattern = /^(.+?)\s+at\s+(.+)$/i;
    const atMatch = text.match(atPattern);
    if (atMatch && !company) {
      position = atMatch[1].trim();
      company = atMatch[2].trim();
    }
    
    // Extract location if present (common patterns)
    const locationPatterns = [
      /\((.*?)\)$/, // (Location) at end
      /,\s*([^,]+)$/, // , Location at end
      /\|\s*([^|]+)$/ // | Location at end
    ];
    
    for (const pattern of locationPatterns) {
      const locationMatch = position.match(pattern);
      if (locationMatch) {
        location = locationMatch[1].trim();
        position = position.replace(pattern, '').trim();
        break;
      }
    }
    
    // Extract salary if present
    const salaryPattern = /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\/(?:hour|hr|year|yr))?/i;
    const salaryMatch = text.match(salaryPattern);
    if (salaryMatch) {
      salary = salaryMatch[0];
    }
    
    // Clean up company and position
    company = this.cleanText(company);
    position = this.cleanText(position);
    
    return {
      company,
      position,
      location,
      salary
    };
  }
  
  parseJobsFromText(content, emailDate) {
    const jobs = [];
    
    // Remove HTML tags if present
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    
    // Look for URLs that might be Simplify links
    const urlPattern = /https?:\/\/[^\s]+simplify\.jobs[^\s]*/g;
    const urls = textContent.match(urlPattern) || [];
    
    // For each URL, try to find associated job text
    urls.forEach(url => {
      // Find text around the URL (before and after)
      const urlIndex = textContent.indexOf(url);
      if (urlIndex > -1) {
        // Get 100 characters before and after the URL
        const before = textContent.substring(Math.max(0, urlIndex - 100), urlIndex).trim();
        const after = textContent.substring(urlIndex + url.length, urlIndex + url.length + 100).trim();
        
        // Try to parse job info from surrounding text
        const combinedText = before + ' ' + after;
        const jobInfo = this.parseJobText(combinedText);
        
        if (jobInfo.company && jobInfo.position) {
          const job = {
            company: jobInfo.company,
            position: jobInfo.position,
            status: 'posted',
            datePosted: emailDate,
            applicationUrl: url,
            location: jobInfo.location || null,
            salaryRange: jobInfo.salary || null
          };
          
          jobs.push(job);
        }
      }
    });
    
    return jobs;
  }
  
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s&.-]/g, '')
      .trim();
  }
  
  deduplicateJobs(jobs) {
    const seen = new Set();
    const uniqueJobs = [];
    
    for (const job of jobs) {
      // Create a unique key based on company + position + location
      const key = `${job.company.toLowerCase()}_${job.position.toLowerCase()}_${job.location || 'no-location'}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueJobs.push(job);
      }
    }
    
    return uniqueJobs;
  }
}

module.exports = JobParser;