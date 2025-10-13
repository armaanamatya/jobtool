import React from 'react';
import { Chart } from 'react-google-charts';
import { Job } from '../types';

interface SankeyModalProps {
  jobs: Job[];
  onClose: () => void;
}

const SankeyModal: React.FC<SankeyModalProps> = ({ jobs, onClose }) => {
  const generateSankeyData = (jobs: Job[]) => {
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

  const getStatusDisplayName = (status: string): string => {
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

  const { data, statusCounts, totalJobs } = generateSankeyData(jobs);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const options = {
    sankey: {
      node: {
        colors: [
          '#6366f1', // posted - indigo
          '#06b6d4', // applied - cyan
          '#eab308', // oa_round - yellow
          '#8b5cf6', // interview - purple
          '#10b981', // offer - green
          '#ef4444', // rejected - red
          '#6b7280', // ghosted - gray
          '#374151'  // total - dark gray
        ],
        label: {
          fontSize: 14,
          color: '#374151',
          bold: true
        }
      },
      link: {
        colorMode: 'gradient',
        colors: [
          '#6366f130', // semi-transparent versions
          '#06b6d430',
          '#eab30830',
          '#8b5cf630',
          '#10b98130',
          '#ef444430',
          '#6b728030'
        ]
      }
    },
    backgroundColor: 'transparent',
    width: '100%',
    height: 400
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Flow Visualization</h2>
            <p className="text-sm text-gray-600 mt-1">
              Sankey diagram showing job application status transitions ({totalJobs} total jobs)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {getStatusDisplayName(status)}
                </div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500">
                  {totalJobs > 0 ? ((count / totalJobs) * 100).toFixed(1) : 0}%
                </div>
              </div>
            ))}
          </div>

          {/* Sankey Diagram */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status Flow</h3>
            {data.length > 1 ? (
              <Chart
                chartType="Sankey"
                width="100%"
                height="400px"
                data={data}
                options={options}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No status transitions found</p>
                <p className="text-sm mt-2">
                  Status transitions will appear here as you move jobs through different stages.
                  Currently showing only current status distribution above.
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">About This Visualization</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Width of connections</strong> represents the number of applications that moved between statuses</p>
              <p>• <strong>Node sizes</strong> represent the current number of applications in each status</p>
              <p>• <strong>Colors</strong> help distinguish between different status categories</p>
              <p>• This helps you understand your application patterns and success rates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SankeyModal;