import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  onStatusUpdate?: (jobId: string, newStatus: Job['status']) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onStatusUpdate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useDraggable({
    id: job._id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const getDaysSinceApplication = () => {
    if (!job.dateApplied) return 0;
    const now = new Date();
    const applied = new Date(job.dateApplied);
    
    // Set both dates to start of day for accurate day calculation
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const appliedDate = new Date(applied.getFullYear(), applied.getMonth(), applied.getDate());
    
    const diffTime = nowDate.getTime() - appliedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays); // Return 0 for same day, prevent negative values
  };

  const getStatusColor = () => {
    const colors = {
      posted: 'border-indigo-400',
      applied: 'border-blue-400',
      oa_round: 'border-yellow-400',
      interview: 'border-purple-400',
      offer: 'border-green-400',
      rejected: 'border-red-400',
      ghosted: 'border-gray-400',
    };
    return colors[job.status] || 'border-gray-300';
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusUpdate && job.status === 'posted') {
      onStatusUpdate(job._id, 'applied');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white rounded-lg shadow-sm border-2 ${getStatusColor()} p-4 cursor-grab hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 rotate-5' : ''
      }`}
    >
      <div className="mb-3">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">{job.company}</h3>
        <p className="text-gray-600 text-sm">{job.position}</p>
      </div>
      
      {job.location && (
        <p className="text-xs text-gray-500 mb-2">{job.location}</p>
      )}
      
      {job.salaryRange && (
        <p className="text-xs text-green-600 font-medium mb-2">{job.salaryRange}</p>
      )}
      
      <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
        <span>Posted: {new Date(job.datePosted).toLocaleDateString()}</span>
        {job.dateApplied && (
          <span className="bg-gray-100 px-2 py-1 rounded-full">
            {(() => {
              const days = getDaysSinceApplication();
              if (days === 0) return 'Applied today';
              if (days === 1) return 'Applied 1 day ago';
              return `Applied ${days} days ago`;
            })()}
          </span>
        )}
      </div>
      
      {job.applicationUrl && (
        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium mt-2"
          onClick={handleApplyClick}
        >
          Apply on Simplify →
        </a>
      )}
      
      {job.notes && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
          {job.notes}
        </div>
      )}
    </div>
  );
};

export default JobCard;