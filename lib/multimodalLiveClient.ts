import EventEmitter from 'eventemitter3';
import { logger } from './logger';

export type MessageType = 'text' | 'video_frame' | 'violation' | 'config' | 'ping';

export interface Message {
  type: MessageType;
  data?: any;
}

export interface VideoFrame {
  imageData: string;
  timestamp: number;
  metadata?: {
    width: number;
    height: number;
    quality: number;
  };
}

export interface ViolationEvent {
  type: string;
  timestamp: string;
  confidence: number;
  details?: string;
}

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      inline_data?: {
        mime_type: string;
        data: string;
      };
      text?: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

/**
 * Client for connecting to Gemini's Multimodal API
 * Handles video proctoring with HTTP communication
 */
export class MultimodalLiveClient extends EventEmitter {
  private apiKey: string;
  private url: string;
  private connected = false;
  private lastAnalysisTime = 0;
  private analysisInterval = 2000; // Check for violations every 2 seconds
  private confidenceThreshold = 0.7;
  private frameQueue: VideoFrame[] = [];
  private processingFrames = false;

  constructor(url: string, apiKey: string) {
    super();
    this.url = url;
    this.apiKey = apiKey;
  }

  /**
   * Initialize the client
   */
  async connect() {
    try {
      // Test connection with a health check
      const response = await fetch('/api/gemini', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Gemini API');
      }

      this.connected = true;
      this.emit('open');
      logger.info('Connected to Gemini API');
    } catch (error) {
      logger.error('Connection error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect the client
   */
  disconnect() {
    this.connected = false;
    this.emit('close');
  }

  /**
   * Check if client is connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Send configuration to the API
   */
  sendConfig(config: any) {
    logger.info('Sending configuration:', config);
    this.emit('config', config);
  }

  /**
   * Process a video frame for proctoring
   */
  async sendVideoFrame(frameData: string) {
    // Extract base64 data without mime type prefix
    const imageData = frameData.slice(frameData.indexOf(',') + 1);
    
    const frame: VideoFrame = {
      imageData,
      timestamp: Date.now(),
      metadata: {
        width: 640,
        height: 480,
        quality: 0.8
      }
    };

    this.frameQueue.push(frame);

    if (!this.processingFrames) {
      await this.processFrameQueue();
    }
  }

  /**
   * Process queued frames
   */
  private async processFrameQueue() {
    if (this.processingFrames || this.frameQueue.length === 0) {
      return;
    }

    this.processingFrames = true;

    try {
      const frame = this.frameQueue.pop();
      this.frameQueue = [];

      if (frame && this.shouldAnalyzeFrame()) {
        await this.analyzeFrame(frame);
      }
    } catch (error) {
      logger.error('Error processing frames:', error);
    } finally {
      this.processingFrames = false;
      
      if (this.frameQueue.length > 0) {
        await this.processFrameQueue();
      }
    }
  }

  /**
   * Check if enough time has passed for next analysis
   */
  private shouldAnalyzeFrame(): boolean {
    const now = Date.now();
    if (now - this.lastAnalysisTime >= this.analysisInterval) {
      this.lastAnalysisTime = now;
      return true;
    }
    return false;
  }

  /**
   * Analyze frame using Gemini API
   */
  private async analyzeFrame(frame: VideoFrame) {
    try {
      const request: GeminiRequest = {
        contents: [{
          parts: [{
            inline_data: {
              mime_type: "image/jpeg",
              data: frame.imageData
            }
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topP: 1,
          topK: 32,
          maxOutputTokens: 256,
        },
        safetySettings: [{
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_LOW_AND_ABOVE"
        }]
      };

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      await this.processViolations(data);
    } catch (error) {
      logger.error('Frame analysis error:', error);
      this.emit('error', error);
    }
  }

  /**
   * Process violations from API response
   */
  private async processViolations(response: any) {
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          const violations = this.extractViolations(part.text);
          for (const violation of violations) {
            if (violation.confidence >= this.confidenceThreshold) {
              this.emit('violation', violation);
            }
          }
        }
      }
    }
  }

  /**
   * Extract violations from model response
   */
  private extractViolations(text: string): ViolationEvent[] {
    const violations: ViolationEvent[] = [];
    const violationRegex = /PROCTORING_VIOLATION:\s*([^\n]+)/g;
    let match;

    while ((match = violationRegex.exec(text)) !== null) {
      violations.push({
        type: match[1].trim(),
        timestamp: new Date().toISOString(),
        confidence: 0.9, // Default confidence
        details: text
      });
    }

    return violations;
  }

  /**
   * Send a message to the API
   */
  private send(message: Message) {
    if (!this.connected) {
      throw new Error("Client not connected");
    }
    this.emit('message', message);
  }
}
