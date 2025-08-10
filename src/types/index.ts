export interface Job {
  _id: string;
  company: string;
  position: string;
  status: 'applied' | 'oa_round' | 'interview' | 'rejected' | 'offer' | 'ghosted';
  dateApplied: string;
  lastUpdated: string;
  emailThreadId?: string;
  notes?: string;
  salaryRange?: string;
  location?: string;
}

export interface JobStats {
  total: number;
  applied: number;
  oa_round: number;
  interview: number;
  rejected: number;
  offer: number;
  ghosted: number;
  responseRate: number;
}
