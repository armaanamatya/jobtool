export interface StatusHistoryEntry {
  status: 'posted' | 'applied' | 'oa_round' | 'interview' | 'rejected' | 'offer' | 'ghosted';
  date: string;
  emailId?: string;
  confidence?: number;
  source?: 'manual' | 'email_automation' | 'application_scraper';
  notes?: string;
}

export interface EmailHistoryEntry {
  emailId: string;
  subject: string;
  sender: string;
  receivedDate: string;
  emailLink?: string;
  classification: 'application' | 'assessment' | 'interview' | 'rejection' | 'offer' | 'unknown';
  confidence: number;
  statusUpdate?: 'posted' | 'applied' | 'oa_round' | 'interview' | 'rejected' | 'offer' | 'ghosted';
  processed: boolean;
}

export interface Job {
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
  applicationUrl?: string;
  statusHistory?: StatusHistoryEntry[];
  emailHistory?: EmailHistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface JobStats {
  total: number;
  posted: number;
  applied: number;
  oa_round: number;
  interview: number;
  rejected: number;
  offer: number;
  ghosted: number;
  responseRate: number;
}
