'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWebcam } from '@/lib/hooks/useWebcam';
import { useLiveAPI } from '@/lib/contexts/LiveAPIContext';
import { captureVideoFrame } from '@/lib/clientTools';
import { ViolationEvent } from '@/lib/multimodalLiveClient';
import { logger } from '@/lib/logger';

interface VideoProctoringProps {
  isActive: boolean;
  frameRate?: number;
  quality?: number;
  showFeed?: boolean;
  onViolationDetected?: (violation: ViolationEvent) => void;
  className?: string;
}

const VideoProctor: React.FC<VideoProctoringProps> = ({
  isActive,
  frameRate = 1,
  quality = 0.8,
  showFeed = true,
  onViolationDetected,
  className = '',
}) => {
  const webcam = useWebcam();
  const { client, connected, connect } = useLiveAPI();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [violations, setViolations] = useState<ViolationEvent[]>([]);
  const [lastViolation, setLastViolation] = useState<ViolationEvent | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Start/stop camera and monitoring when component becomes active/inactive
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isActive]);

  // Connect to LiveAPI when camera is active
  useEffect(() => {
    if (cameraActive && client && !connected) {
      setIsAnalyzing(true);
      connect().finally(() => setIsAnalyzing(false));
    }
  }, [cameraActive, client, connected]);

  // Handle violations
  useEffect(() => {
    const handleViolation = (violation: ViolationEvent) => {
      setViolations(prev => [...prev, violation]);
      setLastViolation(violation);
      
      if (onViolationDetected) {
        onViolationDetected(violation);
      }
    };
    
    if (client) {
      client.on('violation', handleViolation);
      return () => {
        client.off('violation', handleViolation);
      };
    }
  }, [client, onViolationDetected]);

  // Setup video element
  useEffect(() => {
    if (videoRef.current) {
      webcam.connectVideoElement(videoRef.current);
    }
  }, [webcam, videoRef.current]);

  const startCamera = async () => {
    try {
      const stream = await webcam.start();
      
      if (stream) {
        setCameraActive(true);
        setPermissionDenied(false);
        startFrameCapture();
      }
    } catch (err) {
      logger.error('Error accessing camera:', err);
      setPermissionDenied(true);
    }
  };

  const stopCamera = () => {
    webcam.stop();
    setCameraActive(false);
    setViolations([]);
    setLastViolation(null);
    
    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !client || !connected) {
      return;
    }
    
    const frameData = captureVideoFrame(videoRef.current, quality, 0.25); // 25% of original size
    
    if (frameData) {
      client.sendVideoFrame(frameData);
    }
  };

  const startFrameCapture = () => {
    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
    }
    
    // Calculate interval based on desired frame rate
    const interval = Math.floor(1000 / frameRate);
    
    frameIntervalRef.current = window.setInterval(() => {
      if (cameraActive && connected) {
        captureFrame();
      }
    }, interval);
  };

  return (
    <div data-testid="video-proctor" className={`relative w-full max-w-[320px] rounded-lg overflow-hidden ${className}`}>
      {permissionDenied ? (
        <div className="p-5 text-center bg-gray-100 h-60 flex flex-col justify-center items-center">
          <p className="text-sm text-gray-800 mb-3">
            Camera access denied. Please enable camera access to continue with the interview.
          </p>
          <button 
            onClick={startCamera}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="relative">
          {showFeed && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              data-testid="video-feed"
              className={`w-full h-auto bg-gray-100 ${cameraActive ? '' : 'hidden'}`}
            />
          )}
          
          {!showFeed && cameraActive && (
            <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
              <p className="text-white text-sm">Video feed hidden (monitoring active)</p>
            </div>
          )}
          
          {cameraActive && (
            <div data-testid="monitoring-indicator" className="absolute top-2 right-2 flex items-center bg-black/50 px-2 py-1 rounded-full">
              {isAnalyzing ? (
                <>
                  <span className="h-2 w-2 bg-yellow-500 rounded-full mr-1.5 animate-pulse"></span>
                  <span className="text-white text-xs font-medium">Initializing...</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                  <span className="text-white text-xs font-medium">Monitoring</span>
                </>
              )}
            </div>
          )}
          
          {lastViolation && (
            <div className="absolute bottom-2 left-2 right-2 bg-red-500/90 text-white px-3 py-2 rounded text-sm">
              {lastViolation.type}
            </div>
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default VideoProctor;
