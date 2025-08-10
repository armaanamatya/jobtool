import React, { useState } from 'react';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import StatusColumn from './StatusColumn.tsx';
import { Job } from '../types';

const MOCK_JOBS: Job[] = [
  {
    _id: '1',
    company: 'Google',
    position: 'Software Engineer',
    status: 'applied',
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
    dateApplied: '2024-01-10',
    lastUpdated: '2024-01-20',
    location: 'Menlo Park, CA',
  },
  {
    _id: '3',
    company: 'Netflix',
    position: 'Full Stack Engineer',
    status: 'interview',
    dateApplied: '2024-01-08',
    lastUpdated: '2024-01-25',
    location: 'Los Gatos, CA',
    notes: 'Technical interview scheduled for next week'
  }
];

const STATUS_COLUMNS = [
  { id: 'applied', title: 'Applied', color: 'bg-blue-100 border-blue-300' },
  { id: 'oa_round', title: 'OA Round', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'interview', title: 'Interview', color: 'bg-purple-100 border-purple-300' },
  { id: 'offer', title: 'Offer', color: 'bg-green-100 border-green-300' },
  { id: 'rejected', title: 'Rejected', color: 'bg-red-100 border-red-300' },
  { id: 'ghosted', title: 'Ghosted', color: 'bg-gray-100 border-gray-300' },
];

const JobBoard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const jobId = active.id as string;
    const newStatus = over.id as Job['status'];
    
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job._id === jobId 
          ? { ...job, status: newStatus, lastUpdated: new Date().toISOString() }
          : job
      )
    );
  };

  const getJobsByStatus = (status: Job['status']) => {
    return jobs.filter(job => job.status === status);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Application Tracker</h1>
        
        <DndContext
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {STATUS_COLUMNS.map(column => (
              <StatusColumn
                key={column.id}
                id={column.id}
                title={column.title}
                jobs={getJobsByStatus(column.id as Job['status'])}
                className={column.color}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
};

export default JobBoard;