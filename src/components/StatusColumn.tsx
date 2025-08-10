import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import JobCard from './JobCard.tsx';
import { Job } from '../types';

interface StatusColumnProps {
  id: string;
  title: string;
  jobs: Job[];
  className?: string;
}

const StatusColumn: React.FC<StatusColumnProps> = ({ id, title, jobs, className = '' }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col h-full">
      <div className={`rounded-lg border-2 border-dashed p-4 min-h-96 ${className} ${isOver ? 'border-blue-500 bg-blue-50' : ''}`}>
        <h2 className="font-semibold text-lg mb-4 text-gray-700 flex items-center justify-between">
          {title}
          <span className="bg-white text-sm px-2 py-1 rounded-full text-gray-600">
            {jobs.length}
          </span>
        </h2>
        
        <div
          ref={setNodeRef}
          className="space-y-3 min-h-80"
        >
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
          
          {jobs.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <p>No jobs in this status</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusColumn;