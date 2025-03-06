# Production Deployment Guide

This guide covers deploying the video proctoring system in a production environment securely.

## Prerequisites

1. **Production Environment**
   - Node.js >= 16.0.0
   - PNPM >= 8.0.0
   - SSL certificate
   - Production domain

2. **API Keys**
   - Production Gemini API key
   - Production Google Cloud project
   - Production Ultravox API key

## Security Setup

1. **Environment Variables**
   ```bash
   # Production environment file
   cp .env.example .env.production

   # Add production keys securely
   GEMINI_API_KEY=your-production-key
   GOOGLE_CLOUD_PROJECT=your-production-project
   ULTRAVOX_API_KEY=your-production-key
   NODE_ENV=production
   ```

2. **SSL Configuration**
   ```bash
   # Install SSL certificate
   # Configure in your web server or hosting platform
   ```

3. **Security Headers**
   ```typescript
   // Already configured in middleware.ts
   - HSTS
   - CSP
   - Frame Options
   - XSS Protection
   ```

## Production Build

1. **Build Application**
   ```bash
   # Clean install dependencies
   pnpm install --production

   # Build application
   pnpm build
   ```

2. **Verify Build**
   ```bash
   # Run validation
   pnpm run validate

   # Test Gemini integration
   NODE_ENV=production pnpm run test-gemini
   ```

## Deployment Steps

1. **Server Setup**
   ```bash
   # Install Node.js and PNPM
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   
   # Set up process manager
   pnpm install -g pm2
   ```

2. **Application Deployment**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd <repository-directory>

   # Install dependencies
   pnpm install --production

   # Build
   pnpm build

   # Start with PM2
   pm2 start npm --name "proctoring-system" -- start
   ```

## Monitoring & Logging

1. **Application Monitoring**
   ```bash
   # View logs
   pm2 logs proctoring-system

   # Monitor performance
   pm2 monit
   ```

2. **Setup Error Tracking**
   - Implement error logging service
   - Monitor API response times
   - Track violation events

3. **Health Checks**
   ```bash
   # Add to your monitoring service
   GET /api/health
   GET /api/gemini/health
   ```

## Security Best Practices

1. **API Key Management**
   - Use secret management service
   - Rotate keys regularly
   - Monitor API usage

2. **Access Control**
   ```typescript
   // Rate limiting (configured in middleware.ts)
   - 100 requests per minute per IP
   - Adjustable in production config
   ```

3. **Data Protection**
   - SSL/TLS encryption
   - Secure WebSocket connections
   - Data retention policies

## Performance Optimization

1. **Frame Processing**
   ```typescript
   // Configured in VideoProctor.tsx
   frameRate: 1, // Adjust based on needs
   quality: 0.8, // Balance quality vs performance
   ```

2. **Resource Management**
   ```bash
   # Set memory limits
   NODE_OPTIONS="--max-old-space-size=4096"

   # Monitor resource usage
   pm2 monit
   ```

## Scaling Considerations

1. **Horizontal Scaling**
   - Use load balancer
   - Configure session affinity
   - Distribute API calls

2. **API Limits**
   - Monitor Gemini API quotas
   - Implement request queuing
   - Handle rate limits gracefully

## Backup & Recovery

1. **Regular Backups**
   - Environment configuration
   - Logs and analytics
   - Violation records

2. **Failover Strategy**
   ```bash
   # Setup backup instance
   pm2 start npm --name "proctoring-backup" -- start
   ```

## Troubleshooting

1. **Common Issues**
   - API connectivity
   - WebSocket timeouts
   - Resource constraints

2. **Debug Mode**
   ```bash
   # Enable debug logging
   DEBUG=proctoring:* npm start
   ```

## Maintenance

1. **Regular Updates**
   ```bash
   # Update dependencies
   pnpm update

   # Check for security updates
   pnpm audit
   ```

2. **System Health**
   ```bash
   # Check system status
   pm2 status

   # View resource usage
   pm2 monit
   ```

## Support & Documentation

1. For issues, check:
   - Error logs
   - API status
   - Network connectivity
   - Resource usage

2. Documentation:
   - [QUICKSTART.md](./QUICKSTART.md)
   - [PROCTORING.md](./PROCTORING.md)
   - API documentation

## Emergency Procedures

1. **Quick Recovery**
   ```bash
   # Stop service
   pm2 stop proctoring-system

   # Clear cache
   rm -rf .next

   # Rebuild and restart
   pnpm build
   pm2 restart proctoring-system
   ```

2. **Rollback Procedure**
   ```bash
   # Switch to last known good version
   git checkout <last-stable-tag>
   pnpm install --production
   pnpm build
   pm2 restart proctoring-system
   ```

Remember to regularly:
- Monitor system performance
- Update security configurations
- Review access logs
- Test recovery procedures
