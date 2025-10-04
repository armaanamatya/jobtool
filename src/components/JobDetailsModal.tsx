import React from 'react';
import { Job, StatusHistoryEntry, EmailHistoryEntry } from '../types';

interface JobDetailsModalProps {
  job: Job;
  onClose: () => void;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-gray-100 text-gray-800';
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'oa_round': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'ghosted': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'application': return 'bg-blue-100 text-blue-800';
      case 'assessment': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'rejection': return 'bg-red-100 text-red-800';
      case 'offer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{job.company}</h2>
              <p className="text-lg text-gray-600">{job.position}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
              {job.status.replace('_', ' ').toUpperCase()}
            </span>
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

        <div className="p-6 space-y-6">
          {/* Key Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Date Posted</h3>
              <p className="text-lg font-semibold text-gray-900">{formatDate(job.datePosted)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Date Applied</h3>
              <p className="text-lg font-semibold text-gray-900">{formatDate(job.dateApplied || '')}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Last Updated</h3>
              <p className="text-lg font-semibold text-gray-900">{formatDate(job.lastUpdated)}</p>
            </div>
          </div>

          {/* Application Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Location:</span>
                  <p className="text-gray-900">{job.location || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Salary Range:</span>
                  <p className="text-gray-900">{job.salaryRange || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Application URL:</span>
                  {job.applicationUrl ? (
                    <a
                      href={job.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {job.applicationUrl}
                    </a>
                  ) : (
                    <p className="text-gray-900">Not specified</p>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Email Thread ID:</span>
                  <p className="text-gray-900 font-mono text-sm">{job.emailThreadId || 'Not specified'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                {job.notes ? (
                  <p className="text-gray-900 whitespace-pre-wrap">{job.notes}</p>
                ) : (
                  <p className="text-gray-500 italic">No notes added</p>
                )}
              </div>
            </div>
          </div>

          {/* Status History */}
          {job.statusHistory && job.statusHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status History</h3>
              <div className="space-y-3">
                {job.statusHistory.map((entry: StatusHistoryEntry, index: number) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(entry.status)}`}>
                      {entry.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">{formatDateTime(entry.date)}</span>
                    {entry.source && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        {entry.source.replace('_', ' ')}
                      </span>
                    )}
                    {entry.confidence && (
                      <span className="text-xs text-gray-500">
                        {Math.round(entry.confidence * 100)}% confidence
                      </span>
                    )}
                    {entry.notes && (
                      <span className="text-sm text-gray-700 flex-1">{entry.notes}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email History */}
          {job.emailHistory && job.emailHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email History</h3>
              <div className="space-y-3">
                {job.emailHistory.map((email: EmailHistoryEntry, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{email.subject}</h4>
                        <p className="text-sm text-gray-600">From: {email.sender}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(email.receivedDate)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getClassificationColor(email.classification)}`}>
                          {email.classification}
                        </span>
                        {email.processed && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                            Processed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Confidence: {Math.round(email.confidence * 100)}%
                      </span>
                      {email.emailLink && (
                        <a
                          href={email.emailLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View Email
                        </a>
                      )}
                    </div>
                    {email.statusUpdate && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">Status Update: </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(email.statusUpdate)}`}>
                          {email.statusUpdate.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Job ID:</span>
                <p className="text-gray-900 font-mono">{job._id}</p>
              </div>
              {job.createdAt && (
                <div>
                  <span className="font-medium text-gray-500">Created:</span>
                  <p className="text-gray-900">{formatDateTime(job.createdAt)}</p>
                </div>
              )}
              {job.updatedAt && (
                <div>
                  <span className="font-medium text-gray-500">Updated:</span>
                  <p className="text-gray-900">{formatDateTime(job.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;