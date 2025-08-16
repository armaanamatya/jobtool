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
