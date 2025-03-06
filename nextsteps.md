# InterviewBot Video Proctoring Integration Guide

## Overview

This document provides comprehensive instructions for integrating real-time video proctoring into the InterviewBot application using Google's Multimodal Live API. The implementation allows for monitoring interview sessions, detecting suspicious behaviors, and logging violations while maintaining a smooth interview experience.

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Implementation Steps](#implementation-steps)
   - [Step 1: Set Up Dependencies](#step-1-set-up-dependencies)
   - [Step 2: Create Webcam Hooks](#step-2-create-webcam-hooks)
   - [Step 3: Implement Multimodal Live API Client](#step-3-implement-multimodal-live-api-client)
   - [Step 4: Create LiveAPI Context](#step-4-create-liveapi-context)
   - [Step 5: Build Video Proctoring Component](#step-5-build-video-proctoring-component)
   - [Step 6: Configure System Prompt](#step-6-configure-system-prompt)
   - [Step 7: Integrate with Interview Module](#step-7-integrate-with-interview-module)
   - [Step 8: Process Violation Messages](#step-8-process-violation-messages)
4. [Testing and Optimization](#testing-and-optimization)
5. [Troubleshooting](#troubleshooting)
6. [Privacy Considerations](#privacy-considerations)

## Architecture

The video proctoring system consists of several interconnected components:

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│                 │     │                  │     │                   │
│  VideoProctor   │────▶│  WebcamHook      │────▶│  LiveAPIClient    │
│  Component      │     │                  │     │                   │
│                 │     │                  │     │                   │
└─────────────────┘     └──────────────────┘     └───────────┬───────┘
        ▲                                                    │
        │                                                    ▼
┌───────┴───────┐                                   ┌───────────────────┐
│               │                                   │                   │
│ InterviewUI   │◀──────────────────────────────────│ Google Multimodal │
│ Component     │                                   │ Live API          │
│               │                                   │                   │
└───────────────┘                                   └───────────────────┘
```

## Prerequisites

1. Google Gemini API key with access to Multimodal Live API
2. Node.js and npm/pnpm
3. TypeScript knowledge
4. React/Next.js experience

## Implementation Steps

### Step 1: Set Up Dependencies

Add the required dependencies to your project:

```bash
npm install @google/generative-ai eventemitter3 lodash zustand
# or with pnpm
pnpm add @google/generative-ai eventemitter3 lodash zustand
```

Update your `.env.local` file to include your Gemini API key:

```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 2: Create Webcam Hooks

Create a webcam hook to manage camera access and streaming:

```typescript
// src/hooks/use-webcam.ts
import { useCallback, useState } from "react";

export function useWebcam() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const start = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });
      
      setStream(mediaStream);
      setIsStreaming(true);
      setError(null);
      return mediaStream;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsStreaming(false);
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);

  return {
    stream,
    isStreaming,
    error,
    start,
    stop,
  };
}
```

### Step 3: Implement Multimodal Live API Client

Create a client for connecting to the Multimodal Live API:

```typescript
// src/lib/multimodal-live-client.ts
import EventEmitter from "eventemitter3";

export type MessageType =
  | "text"
  | "realtime_input"
  | "function_call"
  | "function_response"
  | "ping";

export interface Message {
  type: MessageType;
  data?: any;
}

export class MultimodalLiveClient extends EventEmitter {
  private socket: WebSocket | null = null;
  private url: string;
  private apiKey: string;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url: string, apiKey: string) {
    super();
    this.url = url;
    this.apiKey = apiKey;
  }

  connect() {
    if (this.socket) {
      return;
    }

    const fullUrl = `${this.url}?key=${this.apiKey}`;
    this.socket = new WebSocket(fullUrl);

    this.socket.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit("open");
    };

    this.socket.onclose = (event) => {
      this.connected = false;
      this.socket = null;
      this.emit("close", event);

      // Attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
      }
    };

    this.socket.onerror = (error) => {
      this.emit("error", error);
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit("message", message);
        
        // Emit specific events based on message type
        if (message.candidates) {
          this.emit("content", message);
        } else if (message.toolCalls) {
          this.emit("toolcall", message);
        }
      } catch (error) {
        this.emit("error", error);
      }
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }

  send(message: Message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    this.socket.send(JSON.stringify(message));
  }

  sendText(text: string) {
    this.send({
      type: "text",
      data: text
    });
  }

  sendRealtimeInput(inputs: Array<{ mimeType: string; data: string }>) {
    this.send({
      type: "realtime_input",
      data: {
        inputs
      }
    });
  }

  sendFunctionResponse(name: string, response: any) {
    this.send({
      type: "function_response",
      data: {
        name,
        response
      }
    });
  }

  sendPing() {
    this.send({ type: "ping" });
  }
}
```

### Step 4: Create LiveAPI Context

Create a context provider to make the API client available throughout your application:

```typescript
// src/contexts/LiveAPIContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { MultimodalLiveClient } from "../lib/multimodal-live-client";

interface LiveAPIContextType {
  client: MultimodalLiveClient | null;
  connected: boolean;
  connecting: boolean;
  connect: () => void;
  disconnect: () => void;
  setConfig: (config: any) => void;
}

const LiveAPIContext = createContext<LiveAPIContextType>({
  client: null,
  connected: false,
  connecting: false,
  connect: () => {},
  disconnect: () => {},
  setConfig: () => {},
});

interface LiveAPIProviderProps {
  url: string;
  apiKey: string;
  children: React.ReactNode;
}

export const LiveAPIProvider: React.FC<LiveAPIProviderProps> = ({
  url,
  apiKey,
  children,
}) => {
  const [client, setClient] = useState<MultimodalLiveClient | null>(null);
  const [config, setConfigState] = useState<any>({});
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const newClient = new MultimodalLiveClient(url, apiKey);
    
    newClient.on("open", () => {
      setConnected(true);
      setConnecting(false);
      
      // Send initial configuration if available
      if (Object.keys(config).length > 0) {
        newClient.send({
          type: "config",
          data: config
        });
      }
    });
    
    newClient.on("close", () => {
      setConnected(false);
      setConnecting(false);
    });
    
    newClient.on("error", (error) => {
      console.error("LiveAPI error:", error);
      setConnecting(false);
    });
    
    setClient(newClient);
    
    return () => {
      newClient.disconnect();
    };
  }, [url, apiKey]);

  const connect = () => {
    if (client && !connected && !connecting) {
      setConnecting(true);
      client.connect();
    }
  };

  const disconnect = () => {
    if (client) {
      client.disconnect();
    }
  };
  
  const setConfig = (newConfig: any) => {
    setConfigState(newConfig);
    
    if (client && connected) {
      client.send({
        type: "config",
        data: newConfig
      });
    }
  };

  return (
    <LiveAPIContext.Provider
      value={{
        client,
        connected,
        connecting,
        connect,
        disconnect,
        setConfig,
      }}
    >
      {children}
    </LiveAPIContext.Provider>
  );
};

export const useLiveAPIContext = () => useContext(LiveAPIContext);
```

### Step 5: Build Video Proctoring Component

Create a VideoProctor component for displaying the webcam feed and capturing frames:

```typescript
// src/components/proctoring/VideoProctor.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useWebcam } from '../../hooks/use-webcam';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import styles from './VideoProctor.module.css';

interface VideoProctoringProps {
  isActive: boolean;
  frameRate?: number;
  quality?: number;
  onViolationDetected?: (violation: string) => void;
  className?: string;
}

const VideoProctor: React.FC<VideoProctoringProps> = ({
  isActive,
  frameRate = 1,
  quality = 0.8,
  onViolationDetected,
  className = '',
}) => {
  const webcam = useWebcam();
  const { client, connected } = useLiveAPIContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  // Start the camera when component becomes active
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

  const startCamera = async () => {
    try {
      const stream = await webcam.start();
      
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setPermissionDenied(false);
        startFrameCapture();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setPermissionDenied(true);
    }
  };

  const stopCamera = () => {
    webcam.stop();
    setCameraActive(false);
    
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !client || !connected) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to 25% of video dimensions
    const width = video.videoWidth * 0.25;
    const height = video.videoHeight * 0.25;
    
    if (width <= 0 || height <= 0) {
      return;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw scaled video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);
    
    // Convert canvas to base64 JPEG
    const base64 = canvas.toDataURL('image/jpeg', quality);
    const data = base64.slice(base64.indexOf(',') + 1);
    
    // Send frame to Multimodal Live API
    client.sendRealtimeInput([{ mimeType: 'image/jpeg', data }]);
  };

  const startFrameCapture = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
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
    <div className={`${styles.videoProctor} ${className}`}>
      {permissionDenied ? (
        <div className={styles.permissionDenied}>
          <p>Camera access denied. Please enable camera access to continue with the interview.</p>
          <button onClick={startCamera}>Try Again</button>
        </div>
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline
          className={cameraActive ? styles.active : ''}
        />
      )}
      {cameraActive && (
        <div className={styles.recordingIndicator}>
          <span className={styles.recordingDot}></span>
          <span className={styles.statusText}>Monitoring Active</span>
        </div>
      )}
      <canvas ref={canvasRef} className={styles.hiddenCanvas} />
    </div>
  );
};

export default VideoProctor;
```

Create the accompanying CSS module:

```css
/* src/components/proctoring/VideoProctor.module.css */
.videoProctor {
  position: relative;
  width: 100%;
  max-width: 320px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.videoProctor video {
  width: 100%;
  height: auto;
  background-color: #f0f0f0;
  display: block;
}

.permissionDenied {
  padding: 20px;
  text-align: center;
  background-color: #f8f8f8;
  height: 240px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.permissionDenied button {
  margin-top: 15px;
  padding: 8px 16px;
  background-color: var(--primary-color, #007bff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.recordingIndicator {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
}

.recordingDot {
  height: 10px;
  width: 10px;
  background-color: #ff4d4d;
  border-radius: 50%;
  margin-right: 5px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.statusText {
  font-weight: 500;
}

.hiddenCanvas {
  display: none;
}
```

### Step 6: Configure System Prompt

Update your system prompt configuration to include proctoring instructions:

```typescript
// src/config/system-prompt.ts
export function getSystemPrompt(language: string = "JavaScript"): string {
  let systemPrompt = `
    // Your existing system prompt content here...

    ## Video Proctoring Instructions - HIGH PRIORITY
    You are also acting as a proctor monitoring the video stream of the interview.
    Analyze the video feed for the following potential violations during the interview.
    Respond ONLY with text-based violation logs if you detect any, otherwise, continue with the interview as normal.
    Do not interrupt the interview flow with verbal warnings; only log violations TEXTUALLY.

    **Violation Detection Criteria:**

    1. **User Attention:**
       - Monitor if the user looks away from the screen for extended periods (more than 3 seconds).
       - Log as: "PROCTORING_VIOLATION: Looking Away"

    2. **Multiple Faces:**
       - Count the number of faces in the frame. 
       - If more than one face is consistently detected, log: 
       - "PROCTORING_VIOLATION: Multiple Faces Detected"

    3. **User Engagement:**
       - Detect if the user appears distracted, tired, or disengaged.
       - Log as: "PROCTORING_VIOLATION: Low Engagement"

    4. **Suspicious Behavior:**
       - Note any suspicious movements like frequently looking off-screen.
       - Log as: "PROCTORING_VIOLATION: Suspicious Movement - [specify movement]"

    5. **Unauthorized Devices:**
       - Detect if phones or other devices are visible in the frame.
       - Log as: "PROCTORING_VIOLATION: Unauthorized Device"

    **Important Guidelines:**
    - Only report clear violations with high confidence to minimize false positives
    - Do not verbally address violations with the user during the interview
    - Focus on the interview content as your primary task; proctoring is secondary
    - Each violation message must start with "PROCTORING_VIOLATION:" for proper processing

    // Continue with rest of your system prompt...
  `;
  
  return systemPrompt;
}
```

### Step 7: Integrate with Interview Module

Integrate the video proctoring into your main interview component:

```typescript
// src/components/InterviewModule.tsx
import { useState, useEffect } from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import VideoProctor from './proctoring/VideoProctor';
import { getSystemPrompt } from '../config/system-prompt';
import styles from './InterviewModule.module.css';

interface InterviewModuleProps {
  // Your existing props
  language: string;
  isActive: boolean;
}

const InterviewModule: React.FC<InterviewModuleProps> = ({
  language,
  isActive,
}) => {
  const { client, connected, connect, setConfig } = useLiveAPIContext();
  const [violations, setViolations] = useState<string[]>([]);
  const [interviewActive, setInterviewActive] = useState(false);
  
  // Connect to API when interview is active
  useEffect(() => {
    if (isActive && !connected) {
      connect();
    }
  }, [isActive, connected, connect]);
  
  // Configure system prompt when connection is established
  useEffect(() => {
    if (connected) {
      const systemPrompt = getSystemPrompt(language);
      setConfig({
        systemPrompt,
        // Add other configuration options as needed
        temperature: 0.7,
        maxOutputTokens: 1024,
      });
      
      setInterviewActive(true);
    } else {
      setInterviewActive(false);
    }
  }, [connected, language, setConfig]);
  
  // Handle detected violations
  const handleViolationDetected = (violation: string) => {
    setViolations(prev => [...prev, `${new Date().toISOString()}: ${violation}`]);
  };

  return (
    <div className={styles.interviewModule}>
      <div className={styles.layout}>
        {/* Main interview content area */}
        <div className={styles.mainContent}>
          {/* Your existing interview UI components */}
        </div>
        
        {/* Proctoring sidebar */}
        <div className={styles.proctoringSidebar}>
          <h3>Interview Monitoring</h3>
          <VideoProctor 
            isActive={interviewActive}
            frameRate={1} // 1 frame per second
            quality={0.8}
            onViolationDetected={handleViolationDetected}
          />
          
          {/* For admin/interviewer view only - can be hidden for candidates */}
          {violations.length > 0 && (
            <div className={styles.violationsList}>
              <h4>Detected Violations</h4>
              <ul>
                {violations.map((violation, index) => (
                  <li key={index}>{violation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewModule;
```

### Step 8: Process Violation Messages

Update your transcript processing to detect and handle proctoring violations:

```typescript
// src/hooks/use-interview.ts or wherever you handle transcripts
const processTranscript = (transcript: string) => {
  // Check if the transcript contains a proctoring violation message
  if (transcript.includes('PROCTORING_VIOLATION:')) {
    const violationMatch = transcript.match(/PROCTORING_VIOLATION:\s*([^\n]+)/);
    
    if (violationMatch && violationMatch[1]) {
      const violationType = violationMatch[1].trim();
      
      // Log the violation
      console.warn('Proctoring violation detected:', violationType);
      
      // You can call a function to handle the violation
      handleViolation(violationType);
      
      // Remove the violation message from the displayed transcript
      return transcript.replace(/PROCTORING_VIOLATION:\s*([^\n]+)/, '');
    }
  }
  
  return transcript;
};

const handleViolation = (violationType: string) => {
  // Add to violations list
  setViolations(prev => [...prev, {
    type: violationType,
    timestamp: new Date().toISOString()
  }]);
  
  // Optionally save to database
  saveViolationToDatabase(violationType);
};
```

## Root Component Integration

Wrap your application with the LiveAPIProvider in your root component:

```typescript
// src/app/layout.tsx or src/pages/_app.tsx
import { LiveAPIProvider } from '../contexts/LiveAPIContext';

// For Next.js App Router
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const apiUrl = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
  
  if (!apiKey) {
    console.error('Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable');
    return <div>Error: API key not configured</div>;
  }
  
  return (
    <html lang="en">
      <body>
        <LiveAPIProvider url={apiUrl} apiKey={apiKey}>
          {children}
        </LiveAPIProvider>
      </body>
    </html>
  );
}

// OR for Next.js Pages Router
function MyApp({ Component, pageProps }) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const apiUrl = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
  
  if (!apiKey) {
    console.error('Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable');
    return <div>Error: API key not configured</div>;
  }
  
  return (
    <LiveAPIProvider url={apiUrl} apiKey={apiKey}>
      <Component {...pageProps} />
    </LiveAPIProvider>
  );
}

export default MyApp;
```

## Testing and Optimization

1. **Frame Rate Optimization**
   - Start with 1 frame per second and adjust based on performance
   - Lower frame rates (0.5 fps) work well for basic proctoring
   - Higher frame rates (2-3 fps) provide more accurate monitoring but use more bandwidth

2. **Image Quality Adjustment**
   - Start with quality = 0.8 for JPEG compression
   - Reduce to 0.6-0.7 if bandwidth is a concern
   - Test with different image sizes (25%, 33%, 50% of original)

3. **Connection Stability**
   - Implement ping/pong mechanism to keep connection alive
   - Add reconnection logic with exponential backoff
   - Show network status indicator to users

4. **Testing Scenarios**
   - Look away from camera for different durations
   - Have a second person appear in frame
   - Use a phone or other device while on camera
   - Test with different lighting conditions
   - Try different browsers and devices

## Troubleshooting

### Common Issues and Solutions

1. **Camera permission denied**
   - Ensure proper user consent flows
   - Provide clear instructions on enabling camera
   - Check for browser permission policies

2. **High bandwidth usage**
   - Reduce frame rate
   - Lower image quality
   - Decrease image dimensions

3. **False positives in violation detection**
   - Adjust system prompt to be more specific
   - Increase confidence thresholds
   - Filter out repeated violations within short time windows

4. **Connection drops**
   - Implement robust reconnection logic
   - Buffer recent frames/interactions
   - Provide graceful degradation

## Privacy Considerations

1. **User Consent**
   - Always inform users they are being recorded
   - Provide clear privacy policies
   - Allow users to opt out while explaining consequences

2. **Data Storage**
   - Do not store raw video frames
   - Encrypt violation logs
   - Implement appropriate data retention policies

3. **Regulatory Compliance**
   - Ensure GDPR/CCPA compliance where applicable
   - Consider legal implications in different jurisdictions
   - Document data handling processes