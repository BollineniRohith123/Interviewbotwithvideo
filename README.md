# Ultravox Interactive AI with Video Proctoring

This project combines Ultravox's voice interview capabilities with Gemini-powered video proctoring for comprehensive interview monitoring.

## New Features

- Real-time video monitoring
- AI-powered proctoring using Gemini Vision API
- Violation detection and reporting
- Non-intrusive integration with voice interviews

## Prerequisites

- Node.js >= 16.0.0
- PNPM >= 8.0.0
- Gemini API Key
- Google Cloud Project
- Ultravox API Key

## Quick Start

1. **Installation**
   ```bash
   # Clean install
   pnpm run cleanup

   # Install dependencies
   pnpm install
   ```

2. **Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env.local

   # Add your API keys
   GEMINI_API_KEY=your-gemini-api-key
   GOOGLE_CLOUD_PROJECT=your-project-id
   ULTRAVOX_API_KEY=your-ultravox-key
   ```

3. **Setup & Validation**
   ```bash
   # Run complete setup
   pnpm run setup
   ```

4. **Development**
   ```bash
   pnpm dev
   ```

## Features

### Video Proctoring
- Face presence detection
- Multiple face detection
- Attention monitoring
- Suspicious behavior detection
- Device detection

### Integration with Voice Interviews
- Non-blocking monitoring
- Real-time violation reporting
- Configurable strictness levels
- Performance optimized

## Configuration Options

### Environment Variables
```env
# Required
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLOUD_PROJECT=your-project-id
ULTRAVOX_API_KEY=your-ultravox-key

# Optional
PROCTORING_STRICTNESS=medium # low | medium | high
```

### Component Usage
```tsx
<VideoProctor
  isActive={true}
  frameRate={1}
  quality={0.8}
  onViolationDetected={(violation) => {
    console.log('Violation:', violation);
  }}
/>
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build production bundle |
| `pnpm start` | Start production server |
| `pnpm run setup` | Complete setup with validation |
| `pnpm run validate` | Validate installation |
| `pnpm run test-gemini` | Test Gemini API integration |

## Documentation

- [Quick Start Guide](./QUICKSTART.md) - Setup and basic usage
- [Proctoring Guide](./PROCTORING.md) - Detailed proctoring documentation
- [API Reference](./app/api/gemini/route.ts) - API documentation

## Development

### Project Structure
```
├── app/
│   ├── api/
│   │   └── gemini/        # Gemini API integration
│   └── components/
│       └── VideoProctor/  # Video monitoring component
├── lib/
│   ├── multimodalLiveClient.ts  # Gemini client
│   └── contexts/         # React contexts
└── scripts/             # Setup and validation scripts
```

### Testing Changes
```bash
# Validate setup
pnpm run validate

# Test Gemini integration
pnpm run test-gemini
```

## Troubleshooting

1. **Installation Issues**
   ```bash
   pnpm run cleanup
   pnpm install --force
   ```

2. **API Issues**
   ```bash
   # Test API connection
   pnpm run test-gemini
   ```

3. **Integration Issues**
   ```bash
   # Validate setup
   pnpm run validate
   ```

## Security Notes

- Keep API keys secure
- Use environment variables
- Regular security updates
- Monitor access logs

## Support

For detailed troubleshooting:
1. Check [QUICKSTART.md](./QUICKSTART.md)
2. Run validation: `pnpm run validate`
3. Check error logs
4. Review documentation

## License

See [LICENSE](./LICENSE)
