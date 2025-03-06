'use client';

import React, { useState, useEffect } from 'react';
import { ViolationEvent } from '@/lib/multimodalLiveClient';
import { Transcript } from 'ultravox-client';

interface InterviewFeedbackProps {
  violations?: ViolationEvent[];
  showToCandidate?: boolean;
  className?: string;
  language?: string;
  transcripts?: Transcript[];
}

const InterviewFeedback: React.FC<InterviewFeedbackProps> = ({
  violations = [],
  showToCandidate = false,
  className = '',
  language = '',
  transcripts = [],
}) => {
  const [groupedViolations, setGroupedViolations] = useState<Record<string, ViolationEvent[]>>({});
  
  // Group violations by type
  useEffect(() => {
    const grouped: Record<string, ViolationEvent[]> = {};
    
    violations.forEach((violation) => {
      if (!grouped[violation.type]) {
        grouped[violation.type] = [];
      }
      grouped[violation.type].push(violation);
    });
    
    setGroupedViolations(grouped);
  }, [violations]);
  
  // Get severity level based on number of occurrences
  const getSeverityLevel = (count: number): 'low' | 'medium' | 'high' => {
    if (count >= 5) return 'high';
    if (count >= 3) return 'medium';
    return 'low';
  };
  
  // Get color class based on severity
  const getSeverityColor = (severity: 'low' | 'medium' | 'high'): string => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get friendly name for violation type
  const getViolationName = (type: string): string => {
    if (type.includes('Looking Away')) return 'Looking Away';
    if (type.includes('Multiple Faces')) return 'Multiple Persons Detected';
    if (type.includes('Low Engagement')) return 'Low Engagement';
    if (type.includes('Suspicious Movement')) return 'Suspicious Activity';
    if (type.includes('Unauthorized Device')) return 'Unauthorized Device';
    return type;
  };
  
  // Get violation details or default message
  const getViolationDetails = (type: string): string => {
    if (type.includes('Looking Away')) {
      return 'Candidate repeatedly looked away from screen';
    }
    if (type.includes('Multiple Faces')) {
      return 'Multiple people detected in the frame';
    }
    if (type.includes('Low Engagement')) {
      return 'Candidate showed signs of disengagement';
    }
    if (type.includes('Suspicious Movement')) {
      const details = type.split('-')[1]?.trim();
      return details ? `Suspicious activity: ${details}` : 'Suspicious movements detected';
    }
    if (type.includes('Unauthorized Device')) {
      return 'Device (possibly phone or tablet) detected in frame';
    }
    return 'Potential integrity violation detected';
  };

  if (violations.length === 0) {
    return null;
  }

  // For candidate view, we show a simplified version
  if (showToCandidate) {
    return (
      <div data-testid="interview-feedback" className={`mt-4 p-3 border rounded-md bg-yellow-50 ${className}`}>
        <h4 className="font-medium text-yellow-800">Interview Monitoring Alert</h4>
        <p className="text-sm text-yellow-700 mt-1">
          Please keep your face clearly visible and maintain focus on the interview.
        </p>
      </div>
    );
  }

  // For proctor/admin view, show detailed violations
  return (
    <div data-testid="interview-feedback" className={`border rounded-md overflow-hidden ${className}`}>
      <div className="bg-gray-50 p-3 border-b">
        <h3 className="font-medium text-gray-900">Proctoring Alerts</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {violations.length} total alerts detected
        </p>
      </div>
      
      <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
        {Object.entries(groupedViolations).map(([type, typeViolations]) => {
          const severity = getSeverityLevel(typeViolations.length);
          const colorClass = getSeverityColor(severity);
          const violationName = getViolationName(type);
          const details = getViolationDetails(type);
          
          return (
            <div 
              key={type}
              data-testid={`violation-${type.toLowerCase().replace(/\s+/g, '-')}`}
              className={`p-3 border rounded-md ${colorClass}`}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium">{violationName}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/50">
                  {typeViolations.length} occurrences
                </span>
              </div>
              <p className="text-sm mt-1">{details}</p>
              <p className="text-xs mt-2 text-gray-700">
                First detected: {new Date(typeViolations[0].timestamp).toLocaleTimeString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewFeedback;
