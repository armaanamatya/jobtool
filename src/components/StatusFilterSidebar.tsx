import React from 'react';
import { Job } from '../types';
import * as XLSX from 'xlsx';

interface StatusFilterSidebarProps {
  jobs: Job[];
  selectedStatuses: string[];
  onStatusToggle: (status: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onShowSankey: () => void;
}

const STATUS_CONFIG = [
  { id: 'posted', title: 'Posted', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'applied', title: 'Applied', color: 'bg-cyan-100 text-cyan-800 border-cyan-600' },
  { id: 'oa_round', title: 'OA Round', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'interview', title: 'Interview', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'offer', title: 'Offer', color: 'bg-green-100 text-green-800 border-green-300' },
  { id: 'rejected', title: 'Rejected', color: 'bg-red-100 text-red-800 border-red-300' },
  { id: 'ghosted', title: 'Ghosted', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

const StatusFilterSidebar: React.FC<StatusFilterSidebarProps> = ({
  jobs,
  selectedStatuses,
  onStatusToggle,
  onSelectAll,
  onClearAll,
  onShowSankey,
}) => {
  const getStatusCount = (status: string) => {
    return jobs.filter(job => job.status === status).length;
  };

  const getTotalCount = () => {
    return jobs.filter(job => selectedStatuses.includes(job.status)).length;
  };

  const exportToExcel = (jobs: Job[], filename: string = 'job-applications') => {
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

  const handleExportToExcel = () => {
    try {
      const filename = exportToExcel(jobs, 'job-applications');
      alert(`Excel file exported successfully: ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export Excel file. Please try again.');
    }
  };

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Status</h2>
        
        {/* Export Buttons */}
        <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={handleExportToExcel}
            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </button>
          <button
            onClick={onShowSankey}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Sankey Graph
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={onSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800 text-left"
          >
            Select All
          </button>
          <button
            onClick={onClearAll}
            className="text-sm text-gray-600 hover:text-gray-800 text-left"
          >
            Clear All
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{getTotalCount()}</span> of{' '}
            <span className="font-semibold">{jobs.length}</span> jobs
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {STATUS_CONFIG.map(status => {
          const count = getStatusCount(status.id);
          const isSelected = selectedStatuses.includes(status.id);
          
          return (
            <div
              key={status.id}
              onClick={() => onStatusToggle(status.id)}
              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm ${
                isSelected 
                  ? `${status.color} border-current` 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded border-2 flex items-center justify-center ${
                  isSelected ? 'bg-current border-current' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                      <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
                    </svg>
                  )}
                </div>
                <span className={`font-medium ${isSelected ? 'text-current' : 'text-gray-700'}`}>
                  {status.title}
                </span>
              </div>
              <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                isSelected 
                  ? 'bg-white bg-opacity-50' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusFilterSidebar;