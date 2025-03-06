# Video Proctoring Integration Guide

This document explains how to set up and use the video proctoring feature integrated with Google's Gemini API.

## Prerequisites

1. **Gemini API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/apikey)
   - Create a new API key
   - Copy the API key for configuration

2. **Google Cloud Project**:
   - Ensure you have a Google Cloud Project
   - Enable the Gemini API for your project
   - Note your project ID

## Setup Instructions

1. **Environment Configuration**:
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   ```

2. **Configure Environment Variables**:
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   GOOGLE_CLOUD_PROJECT=your-project-id
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Restart Development Server**:
   ```bash
   npm run dev
   ```

## Usage

The video proctoring system runs alongside the Ultravox voice interview system without interference. It monitors:

- User attention and engagement
- Multiple face detection
- Unauthorized devices
- Suspicious movements

### Key Features

1. **Real-time Monitoring**:
   - Processes video frames at configurable intervals
   - Uses Gemini Vision API for analysis
   - Provides immediate violation alerts

2. **Security**:
   - Rate limiting
   - Request validation
   - Secure WebSocket connections
   - Data sanitization

3. **Performance**:
   - Optimized frame processing
   - Configurable frame rates
   - Efficient memory usage

## Configuration Options

### Frame Rate Control
```typescript
<VideoProctor
  frameRate={1} // Frames per second
  quality={0.8} // JPEG quality (0-1)
/>
```

### Strictness Levels
```typescript
const config = getDefaultProctoringConfig({
  strictness: 'medium' // 'low' | 'medium' | 'high'
});
```

### Rate Limiting
Configure in `.env.local`:
```env
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

## Violation Events

The system emits the following violation types:

1. **Looking Away**:
   - Triggered when user looks away from screen
   - Configurable duration threshold

2. **Multiple Faces**:
   - Detects additional people in frame
   - Immediate violation

3. **Low Engagement**:
   - Monitors user attention levels
   - Configurable thresholds

4. **Unauthorized Devices**:
   - Detects phones or other devices
   - Real-time alerts

## Handling Violations

```typescript
<VideoProctor
  onViolationDetected={(violation) => {
    console.log('Violation detected:', violation.type);
    // Handle violation
  }}
/>
```

## Production Considerations

1. **API Keys**:
   - Use secure environment variables
   - Rotate keys regularly
   - Set up proper access controls

2. **Rate Limiting**:
   - Adjust based on expected usage
   - Monitor API quotas
   - Implement retry strategies

3. **Error Handling**:
   - Monitor error rates
   - Set up logging
   - Configure alerts

4. **Performance**:
   - Monitor server load
   - Watch memory usage
   - Track API latency

## Troubleshooting

### Common Issues

1. **Connection Problems**:
   ```
   Check:
   - WebSocket connection
   - API key validity
   - Network connectivity
   ```

2. **Performance Issues**:
   ```
   Adjust:
   - Frame rate
   - Image quality
   - Analysis frequency
   ```

3. **False Positives**:
   ```
   Tune:
   - Strictness levels
   - Detection thresholds
   - Confidence scores
   ```

### Support

For issues or questions:
1. Check the troubleshooting guide above
2. Review error logs
3. Contact support with error details

## Security Notes

- Keep API keys secure
- Monitor access logs
- Regular security audits
- Update dependencies
- Follow security best practices

Remember to test thoroughly in a staging environment before deploying to production.
