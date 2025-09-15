import React from 'react';
import { Job } from '../types';

interface StatusFilterSidebarProps {
  jobs: Job[];
  selectedStatuses: string[];
  onStatusToggle: (status: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
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
}) => {
  const getStatusCount = (status: string) => {
    return jobs.filter(job => job.status === status).length;
  };

  const getTotalCount = () => {
    return jobs.filter(job => selectedStatuses.includes(job.status)).length;
  };

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Status</h2>
        
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