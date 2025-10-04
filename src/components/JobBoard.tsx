import React, { useState, useMemo, useEffect } from 'react';
import StatusFilterSidebar from './StatusFilterSidebar.tsx';
import DateFilter from './DateFilter.tsx';
import JobCard from './JobCard.tsx';
import JobDetailsModal from './JobDetailsModal.tsx';
import { Job } from '../types';

const MOCK_JOBS: Job[] = [
  {
    _id: '1',
    company: 'Google',
    position: 'Software Engineer',
    status: 'applied',
    datePosted: '2024-01-10',
    dateApplied: '2024-01-15',
    lastUpdated: '2024-01-15',
    location: 'Mountain View, CA',
    salaryRange: '$120k - $180k'
  },
  {
    _id: '2',
    company: 'Meta',
    position: 'Frontend Developer',
    status: 'oa_round',
    datePosted: '2024-01-05',
    dateApplied: '2024-01-10',
    lastUpdated: '2024-01-20',
    location: 'Menlo Park, CA',
  },
  {
    _id: '3',
    company: 'Netflix',
    position: 'Full Stack Engineer',
    status: 'interview',
    datePosted: '2024-01-03',
    dateApplied: '2024-01-08',
    lastUpdated: '2024-01-25',
    location: 'Los Gatos, CA',
    notes: 'Technical interview scheduled for next week'
  },
  {
    _id: '4',
    company: 'Apple',
    position: 'iOS Developer',
    status: 'posted',
    datePosted: '2024-01-20',
    lastUpdated: '2024-01-20',
    location: 'Cupertino, CA',
    salaryRange: '$130k - $190k',
    applicationUrl: 'https://simplify.jobs/c/Apple/12345'
  },
  {
    _id: '5',
    company: 'Microsoft',
    position: 'Software Engineer Intern',
    status: 'posted',
    datePosted: '2024-01-22',
    lastUpdated: '2024-01-22',
    location: 'Redmond, WA',
    applicationUrl: 'https://simplify.jobs/c/Microsoft/67890'
  }
];


const JobBoard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['posted', 'applied', 'oa_round', 'interview', 'offer', 'rejected', 'ghosted']);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);


  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:3001/api/jobs');
        if (!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.statusText}`);
        }
        
        const jobsData = await response.json();
        setJobs(jobsData);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
        // Fallback to mock data if API fails
        setJobs(MOCK_JOBS);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesStatus = selectedStatuses.includes(job.status);
      
      // Search filtering
      const matchesSearch = !searchQuery || 
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.position.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!startDate && !endDate) return matchesStatus && matchesSearch;
      
      // Use dateApplied for filtering - only filter jobs that have been applied to
      if (!job.dateApplied) return matchesStatus && matchesSearch;
      
      const jobDate = new Date(job.dateApplied);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      const matchesDate = (!start || jobDate >= start) && (!end || jobDate <= end);
      
      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [jobs, selectedStatuses, startDate, endDate, searchQuery]);


  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleSelectAllStatuses = () => {
    setSelectedStatuses(['posted', 'applied', 'oa_round', 'interview', 'offer', 'rejected', 'ghosted']);
  };

  const handleClearAllStatuses = () => {
    setSelectedStatuses([]);
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleJobStatusUpdate = async (jobId: string, newStatus: Job['status']) => {
    try {
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const updateData = {
        status: newStatus,
        dateApplied: newStatus === 'applied' ? currentDate : undefined
      };

      const response = await fetch(`http://localhost:3001/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update job status: ${response.statusText}`);
      }

      const updatedJob = await response.json();
      
      // Update local state with the response from server
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === jobId ? updatedJob : job
        )
      );
    } catch (error) {
      console.error('Error updating job status:', error);
      // Fallback to local state update if API fails
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === jobId 
            ? { 
                ...job, 
                status: newStatus, 
                dateApplied: newStatus === 'applied' && !job.dateApplied 
                  ? new Date().toISOString().split('T')[0] 
                  : job.dateApplied,
                lastUpdated: new Date().toISOString().split('T')[0]
              }
            : job
        )
      );
    }
  };

  const handleJobDelete = async (jobId: string, company: string, position: string) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete the job application for ${position} at ${company}? This action cannot be undone.`);
    
    if (!isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:3001/api/jobs/${jobId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete job: ${response.statusText}`);
      }

      // Remove job from local state
      setJobs(prevJobs => prevJobs.filter(job => job._id !== jobId));
      
      console.log(`Job deleted successfully: ${company} - ${position}`);
    } catch (error) {
      console.error('Error deleting job:', error);
      alert(`Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar - 20% width */}
        <div className="w-1/5 min-w-64">
          <StatusFilterSidebar
            jobs={jobs}
            selectedStatuses={selectedStatuses}
            onStatusToggle={handleStatusToggle}
            onSelectAll={handleSelectAllStatuses}
            onClearAll={handleClearAllStatuses}
          />
        </div>
        
        {/* Main Content - 80% width */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Job Application Tracker</h1>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search companies and roles..."
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchQuery && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      type="button"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <DateFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onClearDates={handleClearDates}
            />
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading jobs...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">
                <p className="text-lg">⚠️ Error loading jobs</p>
                <p className="text-sm mt-2">{error}</p>
                <p className="text-sm mt-2 text-gray-500">Showing mock data as fallback</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredJobs.map(job => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onStatusUpdate={handleJobStatusUpdate}
                      onDelete={handleJobDelete}
                      onClick={() => setSelectedJob(job)}
                    />
                  ))}
                </div>
                
                {filteredJobs.length === 0 && jobs.length > 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No jobs match your current filters.</p>
                    <p className="text-sm mt-2">Try adjusting your status or date filters.</p>
                  </div>
                )}
                
                {jobs.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No jobs found in database.</p>
                    <p className="text-sm mt-2">Run the email scraper to populate jobs.</p>
                    <p className="text-sm mt-1">Command: <code className="bg-gray-100 px-2 py-1 rounded">node scripts/runScraper.js</code></p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
};

export default JobBoard;