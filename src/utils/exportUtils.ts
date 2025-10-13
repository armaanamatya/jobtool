import * as XLSX from 'xlsx';
import { Job } from '../types';

export const exportToExcel = (jobs: Job[], filename: string = 'job-applications') => {
  // Prepare data for Excel export
  const excelData = jobs.map(job => ({
    'Company': job.company,
    'Position': job.position,
    'Status': job.status,
    'Date Posted': job.datePosted ? new Date(job.datePosted).toLocaleDateString() : '',
    'Date Applied': job.dateApplied ? new Date(job.dateApplied).toLocaleDateString() : '',
    'Location': job.location || '',
    'Salary Range': job.salaryRange || '',
    'Application URL': job.applicationUrl || '',
    'Notes': job.notes || '',
    'Last Updated': job.lastUpdated ? new Date(job.lastUpdated).toLocaleDateString() : ''
  }));

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Auto-size columns
  const columnWidths = [
    { wch: 20 }, // Company
    { wch: 30 }, // Position
    { wch: 12 }, // Status
    { wch: 12 }, // Date Posted
    { wch: 12 }, // Date Applied
    { wch: 15 }, // Location
    { wch: 15 }, // Salary Range
    { wch: 40 }, // Application URL
    { wch: 30 }, // Notes
    { wch: 12 }  // Last Updated
  ];
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Applications');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = `${filename}-${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, finalFilename);
  
  return finalFilename;
};

export const generateSankeyData = (jobs: Job[]) => {
  // Count transitions between statuses
  const statusFlow: { [key: string]: { [key: string]: number } } = {};
  const statusCounts: { [key: string]: number } = {};

  // Initialize status counts
  const allStatuses = ['posted', 'applied', 'oa_round', 'interview', 'offer', 'rejected', 'ghosted'];
  allStatuses.forEach(status => {
    statusCounts[status] = 0;
    statusFlow[status] = {};
    allStatuses.forEach(toStatus => {
      statusFlow[status][toStatus] = 0;
    });
  });

  // Count current status distribution
  jobs.forEach(job => {
    if (statusCounts.hasOwnProperty(job.status)) {
      statusCounts[job.status]++;
    }
  });

  // Track status transitions from history
  jobs.forEach(job => {
    if (job.statusHistory && job.statusHistory.length > 1) {
      for (let i = 0; i < job.statusHistory.length - 1; i++) {
        const fromStatus = job.statusHistory[i].status;
        const toStatus = job.statusHistory[i + 1].status;
        
        if (statusFlow[fromStatus] && statusFlow[fromStatus][toStatus] !== undefined) {
          statusFlow[fromStatus][toStatus]++;
        }
      }
    }
  });

  // Convert to Sankey format for react-google-charts
  const sankeyData = [
    ['From', 'To', 'Weight']
  ];

  // Add transitions with weight > 0
  Object.keys(statusFlow).forEach(fromStatus => {
    Object.keys(statusFlow[fromStatus]).forEach(toStatus => {
      const weight = statusFlow[fromStatus][toStatus];
      if (weight > 0) {
        sankeyData.push([
          fromStatus.replace('_', ' ').toUpperCase(),
          toStatus.replace('_', ' ').toUpperCase(),
          weight
        ]);
      }
    });
  });

  // If no transitions, create a simple flow based on current status
  if (sankeyData.length === 1) {
    Object.keys(statusCounts).forEach(status => {
      const count = statusCounts[status];
      if (count > 0) {
        sankeyData.push([
          'TOTAL',
          status.replace('_', ' ').toUpperCase(),
          count
        ]);
      }
    });
  }

  return {
    data: sankeyData,
    statusCounts,
    totalJobs: jobs.length
  };
};

export const getStatusDisplayName = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'posted': 'Posted',
    'applied': 'Applied',
    'oa_round': 'OA Round',
    'interview': 'Interview',
    'offer': 'Offer',
    'rejected': 'Rejected',
    'ghosted': 'Ghosted'
  };
  
  return statusMap[status] || status;
};