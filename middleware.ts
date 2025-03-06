import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple rate limiting implementation
const rateLimit = {
  windowMs: 60 * 1000, // 1 minute
  max: 100 // limit each IP to 100 requests per windowMs
};

const ipRequestMap = new Map<string, { count: number; resetTime: number }>();

// Clean up old rate limit entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestMap.entries()) {
    if (now > data.resetTime) {
      ipRequestMap.delete(ip);
    }
  }
}, 60000);

export function middleware(request: NextRequest) {
  // Get response
  const response = NextResponse.next();

  // Add security headers
  const headers = response.headers;
  
  headers.set('X-DNS-Prefetch-Control', 'on');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  // Only allow camera and microphone for our domain
  headers.set(
    'Permissions-Policy', 
    'camera=(self), microphone=(self), geolocation=()'
  );

  // Content Security Policy
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data:",
      "media-src 'self' blob:",
      "connect-src 'self' wss://generativelanguage.googleapis.com https://generativelanguage.googleapis.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'"
    ].join('; ')
  );

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const now = Date.now();

    if (!ipRequestMap.has(ip)) {
      ipRequestMap.set(ip, {
        count: 1,
        resetTime: now + rateLimit.windowMs
      });
    } else {
      const data = ipRequestMap.get(ip)!;
      
      // Reset if window has passed
      if (now > data.resetTime) {
        ipRequestMap.set(ip, {
          count: 1,
          resetTime: now + rateLimit.windowMs
        });
      } else if (data.count >= rateLimit.max) {
        // Rate limit exceeded
        return new NextResponse(
          JSON.stringify({ 
            error: 'Too many requests',
            retryAfter: Math.ceil((data.resetTime - now) / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((data.resetTime - now) / 1000).toString()
            }
          }
        );
      } else {
        // Increment counter
        data.count++;
      }
    }

    // Add rate limit headers
    const rateLimitData = ipRequestMap.get(ip)!;
    headers.set('X-RateLimit-Limit', rateLimit.max.toString());
    headers.set('X-RateLimit-Remaining', (rateLimit.max - rateLimitData.count).toString());
    headers.set('X-RateLimit-Reset', Math.ceil(rateLimitData.resetTime / 1000).toString());
  }

  // Add server timing
  const startTime = Date.now();
  headers.set('Server-Timing', `total;dur=${Date.now() - startTime}`);

  return response;
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
