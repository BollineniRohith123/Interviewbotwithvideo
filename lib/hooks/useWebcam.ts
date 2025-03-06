import { useState, useCallback, useRef } from 'react';
import { requestWebcamAccess, stopMediaStream } from '../clientTools';

interface UseWebcamOptions {
  autoStart?: boolean;
  constraints?: MediaStreamConstraints;
}

export function useWebcam(options: UseWebcamOptions = {}) {
  const { 
    autoStart = false, 
    constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
      audio: false
    } 
  } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  // Store video element ref for external access
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const start = useCallback(async () => {
    try {
      // Reset states
      setError(null);
      setPermissionDenied(false);
      
      const mediaStream = await requestWebcamAccess(constraints);
      
      if (mediaStream) {
        setStream(mediaStream);
        setIsStreaming(true);
        return mediaStream;
      } else {
        throw new Error("Failed to get media stream");
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Check if it's a permission denied error
      if (error.name === 'NotAllowedError' || error.message.includes('Permission')) {
        setPermissionDenied(true);
      }
      
      setError(error);
      setIsStreaming(false);
      return null;
    }
  }, [constraints]);

  const stop = useCallback(() => {
    if (stream) {
      stopMediaStream(stream);
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);

  // Connect video element to the hook
  const connectVideoElement = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    
    if (element && stream) {
      element.srcObject = stream;
    }
  }, [stream]);

  return {
    stream,
    isStreaming,
    error,
    permissionDenied,
    videoRef,
    start,
    stop,
    connectVideoElement
  };
}

export default useWebcam;