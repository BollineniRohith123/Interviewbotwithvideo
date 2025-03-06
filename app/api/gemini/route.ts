import { NextResponse, NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

interface GeminiError {
  error: string;
  message?: string;
  details?: any;
}

interface ImagePart {
  inline_data: {
    mime_type: string;
    data: string;
  };
}

interface TextPart {
  text: string;
}

interface Content {
  parts: (ImagePart | TextPart)[];
}

interface GeminiRequest {
  contents: Content[];
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

// API configuration
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';

// Validate API key
const validateApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return apiKey;
};

// Error response helper
const errorResponse = (error: GeminiError, status: number = 500): NextResponse => {
  logger.error('Gemini API error:', error);
  return NextResponse.json(error, { status });
};

export async function POST(request: NextRequest) {
  try {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Start timing
    const startTime = Date.now();

    // Validate API key
    const apiKey = validateApiKey();

    // Parse and validate request body
    const rawBody = await request.json();
    const requestData: GeminiRequest = {
      contents: rawBody.contents,
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

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    // Make request to Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorText;
      } catch {
        errorMessage = errorText;
      }

      return errorResponse({
        error: 'Gemini API error',
        message: errorMessage,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      }, response.status);
    }

    const data = await response.json();
    
    // Calculate execution time
    const executionTime = Date.now() - startTime;
    
    // Add performance headers
    const responseHeaders = new Headers({
      'Server-Timing': `total;dur=${executionTime}`,
      'X-Response-Time': `${executionTime}ms`,
      'Cache-Control': 'no-store'
    });

    return NextResponse.json(data, { 
      headers: responseHeaders,
      status: 200 
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return errorResponse({
          error: 'Configuration Error',
          message: 'API key is not properly configured',
          details: error.message
        }, 500);
      }
      
      return errorResponse({
        error: 'API Error',
        message: error.message,
        details: error
      }, 500);
    }

    return errorResponse({
      error: 'Unknown Error',
      message: 'An unexpected error occurred',
      details: error
    }, 500);
  }
}

// Health check endpoint
export async function GET() {
  try {
    const apiKey = validateApiKey();
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API health check failed');
    }

    return NextResponse.json({ status: 'healthy' });
  } catch (error) {
    return errorResponse({
      error: 'Health Check Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 503);
  }
}
