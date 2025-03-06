import { ClientToolImplementation } from 'ultravox-client';

interface InterviewDataStore {
  candidate: {
    name: string;
    position: string;
    years_of_experience: number;
  };
  session: {
    timestamp: string;
    startTime: number;
    duration: number;
    completed_categories: string[];
  };
  qa_history: Array<{
    question: string;
    answer: string;
    category: string;
    score?: number;
  }>;
  progress: {
    completed_categories: string[];
    current_category: string;
    questions_remaining: number;
    average_score: number;
  };
  technical_evaluation: {
    category_scores: Record<string, {
      score: number;
      questions: number;
    }>;
    overall_score: number;
  };
  final_evaluation: {
    technical_score: number;
    recommendation: {
      hire_recommendation: boolean;
      justification: string;
    };
  };
}

interface InterviewData {
  type: 'candidate_info' | 'question_answer' | 'category_complete' | 'interview_complete';
  data: Record<string, any>;
}

// Interview data store
let interviewData: InterviewDataStore = {
  candidate: {
    name: "",
    position: "",
    years_of_experience: 0
  },
  session: {
    timestamp: new Date().toISOString(),
    startTime: Date.now(),
    duration: 0,
    completed_categories: []
  },
  qa_history: [],
  progress: {
    completed_categories: [],
    current_category: "",
    questions_remaining: 0,
    average_score: 0
  },
  technical_evaluation: {
    category_scores: {},
    overall_score: 0
  },
  final_evaluation: {
    technical_score: 0,
    recommendation: {
      hire_recommendation: false,
      justification: ""
    }
  }
};

export const captureInterviewDataTool: ClientToolImplementation = (parameters: any) => {
  const data = parameters.interviewData as InterviewData;
  console.debug("Capturing interview data:", data);

  try {
    switch (data.type) {
      case 'candidate_info':
        interviewData.candidate = {
          ...interviewData.candidate,
          name: data.data.name || interviewData.candidate.name,
          position: data.data.position || interviewData.candidate.position,
          years_of_experience: Number(data.data.years_of_experience) || interviewData.candidate.years_of_experience
        };
        break;
      case 'question_answer':
        const qaData = {
          question: String(data.data.question || ''),
          answer: String(data.data.answer || ''),
          category: String(data.data.category || ''),
          score: typeof data.data.score === 'number' ? data.data.score : undefined
        };
        interviewData.qa_history.push(qaData);
        break;
      case 'category_complete':
        if (typeof data.data.category === 'string') {
          const category = data.data.category;
          if (!interviewData.progress.completed_categories.includes(category)) {
            interviewData.progress.completed_categories.push(category);
          }
        }
        break;
      case 'interview_complete':
        const endTime = Date.now();
        interviewData.session.duration = endTime - interviewData.session.startTime;
        
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('interviewCompleted', { 
            detail: { 
              ...interviewData,
              finalStatus: {
                candidate_name: data.data.candidate_name || interviewData.candidate.name,
                interview_result: data.data.interview_result || 'Interview completed'
              }
            } 
          });
          window.dispatchEvent(event);
        }
        break;
    }

    return "Interview data captured successfully";
  } catch (error) {
    console.error("Error capturing interview data:", error);
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

// Client-implemented tool for Order Details
export const updateOrderTool: ClientToolImplementation = (parameters: any) => {
  const { orderDetailsData } = parameters;
  console.debug("Received order details update:", orderDetailsData);

  if (typeof window !== "undefined") {
    const event = new CustomEvent("orderDetailsUpdated", {
      detail: orderDetailsData
    });
    window.dispatchEvent(event);
  }

  return "Updated the order details.";
};

// Client-implemented tool for Product Highlighting
export const highlightProductTool: ClientToolImplementation = (parameters: any) => {
  const { productName, action } = parameters;
  console.debug(`Highlighting product: ${productName}, action: ${action}`);

  // Normalize the product name to match the display names
  const normalizedName = productName.toLowerCase()
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (typeof window !== "undefined") {
    const event = new CustomEvent("productHighlight", {
      detail: { 
        productName: normalizedName, 
        action 
      }
    });
    window.dispatchEvent(event);
  }

  return `${action === 'show' ? 'Highlighted' : 'Unhighlighted'} ${normalizedName}`;
};

// Webcam utilities for video proctoring

/**
 * Requests webcam access and returns a MediaStream if successful
 */
export async function requestWebcamAccess(constraints: MediaStreamConstraints = { 
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user",
  }, 
  audio: false 
}): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (err) {
    console.error('Error accessing webcam:', err);
    return null;
  }
}

/**
 * Stops all tracks in a MediaStream
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

/**
 * Captures a frame from a video element at reduced quality for proctoring
 */
export function captureVideoFrame(
  videoElement: HTMLVideoElement,
  quality: number = 0.8,
  scaleFactor: number = 0.25
): string | null {
  if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
    return null;
  }

  const canvas = document.createElement('canvas');
  const width = videoElement.videoWidth * scaleFactor;
  const height = videoElement.videoHeight * scaleFactor;
  
  if (width <= 0 || height <= 0) {
    return null;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  ctx.drawImage(videoElement, 0, 0, width, height);
  
  // Convert to base64 JPEG with reduced quality
  return canvas.toDataURL('image/jpeg', quality);
}

// Export all tools to make them available to the application
export const clientTools = {
  updateOrder: updateOrderTool,
  highlightProduct: highlightProductTool,
  captureInterviewData: captureInterviewDataTool
};
