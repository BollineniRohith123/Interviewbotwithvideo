# Quick Start Guide

This guide will help you set up and integrate the video proctoring system with your existing Ultravox voice interview setup.

## Prerequisites

1. **Required Software**
   - Node.js >= 16.0.0
   - PNPM >= 8.0.0

2. **API Keys & Project**
   - Gemini API key (from [Google AI Studio](https://aistudio.google.com/apikey))
   - Google Cloud Project ID
   - Existing Ultravox API key

## Installation

1. **Clean Installation**
   ```bash
   # Clean existing installation
   pnpm run cleanup

   # Install dependencies
   pnpm install
   ```

2. **Configure Environment**
   ```bash
   # Copy environment file if not exists
   cp .env.example .env.local

   # Add your API keys to .env.local
   GEMINI_API_KEY=your-gemini-api-key
   GOOGLE_CLOUD_PROJECT=your-project-id
   ```

3. **Run Setup**
   ```bash
   # Run the setup script
   pnpm run setup-proctoring

   # Verify installation
   pnpm run check-proctoring
   ```

## Integration with Ultravox

Add the VideoProctor component to your interview page:

```tsx
import { VideoProctor } from '@/app/components/VideoProctor';

// In your interview component:
<VideoProctor
  isActive={isInterviewActive}
  frameRate={1}
  quality={0.8}
  onViolationDetected={(violation) => {
    console.log('Violation detected:', violation);
    // Handle violation
  }}
/>
```

## Configuration Options

1. **Frame Rate & Quality**
   ```tsx
   <VideoProctor
     frameRate={1} // Frames per second (default: 1)
     quality={0.8} // JPEG quality 0-1 (default: 0.8)
   />
   ```

2. **Strictness Levels** (in `.env.local`)
   ```env
   PROCTORING_STRICTNESS=medium # low | medium | high
   ```

## Common Issues & Solutions

1. **Installation Issues**
   ```bash
   # If pnpm install fails, try:
   pnpm run cleanup
   pnpm store prune
   pnpm install --force
   ```

2. **API Connection Issues**
   - Verify API keys in .env.local
   - Check network connectivity
   - Ensure proper CORS configuration

3. **Performance Issues**
   - Reduce frame rate
   - Lower image quality
   - Check network bandwidth

4. **Integration Issues**
   ```bash
   # Check all components are properly linked
   pnpm run check-proctoring
   
   # Clear Next.js cache
   rm -rf .next
   pnpm build
   ```

## Development

1. **Running in Development**
   ```bash
   pnpm dev
   ```

2. **Testing Changes**
   ```bash
   # Run type checks
   pnpm tsc --noEmit

   # Check proctoring setup
   pnpm run check-proctoring
   ```

## Production Deployment

1. **Build**
   ```bash
   pnpm build
   ```

2. **Environment Setup**
   - Set GEMINI_API_KEY in production
   - Configure GOOGLE_CLOUD_PROJECT
   - Set NODE_ENV=production

3. **Performance Monitoring**
   - Monitor API usage
   - Check violation logs
   - Monitor system resources

## Troubleshooting Checklist

- [ ] Environment variables set correctly
- [ ] Dependencies installed successfully
- [ ] API keys validated
- [ ] Network connectivity verified
- [ ] CORS configured properly
- [ ] WebSocket connections working
- [ ] Camera permissions granted
- [ ] Frame processing validated

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review error logs (`pnpm run check-proctoring`)
3. Verify all prerequisites are met
4. Check GitHub issues for known problems

## Security Notes

- Keep API keys secure
- Monitor access logs
- Regular security updates
- Follow security best practices
- Regular dependency updates

For detailed documentation, see [PROCTORING.md](./PROCTORING.md).
