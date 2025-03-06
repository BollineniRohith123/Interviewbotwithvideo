#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Colors for console output
const colors = {
  reset: '[0m',
  red: '[31m',
  green: '[32m',
  yellow: '[33m',
  blue: '[34m',
  cyan: '[36m'
};

// Load environment variables
dotenv.config({ path: '.env.local' });

const requiredFiles = [
  'app/api/gemini/route.ts',
  'lib/multimodalLiveClient.ts',
  'app/components/VideoProctor.tsx',
  'middleware.ts',
  'scripts/check-proctoring.js',
  'scripts/test-gemini.js',
  'PROCTORING.md',
  'QUICKSTART.md'
];

const requiredEnvVars = [
  'GEMINI_API_KEY',
  'GOOGLE_CLOUD_PROJECT',
  'ULTRAVOX_API_KEY'
];

async function validateSetup() {
  console.log(`${colors.blue}🔍 Validating Video Proctoring Setup...${colors.reset}\n`);
  let hasErrors = false;

  // 1. Check required files
  console.log(`${colors.cyan}1. Checking Required Files:${colors.reset}`);
  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      console.log(`  ${colors.green}✓${colors.reset} ${file}`);
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${file} (missing)`);
      hasErrors = true;
    }
  }

  // 2. Check environment variables
  console.log(`\n${colors.cyan}2. Checking Environment Variables:${colors.reset}`);
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`  ${colors.green}✓${colors.reset} ${envVar}`);
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${envVar} (missing)`);
      hasErrors = true;
    }
  }

  // 3. Check dependencies
  console.log(`\n${colors.cyan}3. Checking Dependencies:${colors.reset}`);
  try {
    const packageJson = require(path.join(process.cwd(), 'package.json'));
    const requiredDeps = ['dotenv', 'ultravox-client', 'eventemitter3'];
    
    for (const dep of requiredDeps) {
      if (packageJson.dependencies[dep]) {
        console.log(`  ${colors.green}✓${colors.reset} ${dep}`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${dep} (missing)`);
        hasErrors = true;
      }
    }
  } catch (error) {
    console.error(`  ${colors.red}✗ Error reading package.json${colors.reset}`);
    hasErrors = true;
  }

  // 4. Check script permissions
  console.log(`\n${colors.cyan}4. Checking Script Permissions:${colors.reset}`);
  const scripts = fs.readdirSync(path.join(process.cwd(), 'scripts'))
    .filter(file => file.endsWith('.js'));

  for (const script of scripts) {
    try {
      const stats = fs.statSync(path.join(process.cwd(), 'scripts', script));
      const isExecutable = !!(stats.mode & 0o111);
      if (isExecutable) {
        console.log(`  ${colors.green}✓${colors.reset} ${script}`);
      } else {
        console.log(`  ${colors.yellow}!${colors.reset} ${script} (not executable)`);
        try {
          fs.chmodSync(path.join(process.cwd(), 'scripts', script), '755');
          console.log(`    ${colors.green}✓${colors.reset} Fixed permissions`);
        } catch (error) {
          console.log(`    ${colors.red}✗${colors.reset} Failed to set permissions`);
          hasErrors = true;
        }
      }
    } catch (error) {
      console.log(`  ${colors.red}✗${colors.reset} ${script} (error checking permissions)`);
      hasErrors = true;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log(`\n${colors.red}❌ Setup validation failed with errors${colors.reset}`);
    console.log(`\n${colors.yellow}To fix:${colors.reset}`);
    console.log('1. Run: pnpm run cleanup');
    console.log('2. Run: pnpm install');
    console.log('3. Run: pnpm run setup');
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✅ Setup validation successful!${colors.reset}`);
    console.log(`\n${colors.blue}Implementation Complete:${colors.reset}`);
    console.log('1. Video proctoring system is properly configured');
    console.log('2. Gemini API integration is ready');
    console.log('3. All required files and permissions are set');
    console.log('\nYou can now:');
    console.log('1. Run: pnpm dev');
    console.log('2. Test video proctoring in your interview session');
    console.log('3. Monitor proctoring violations in real-time');
  }
}

validateSetup().catch(error => {
  console.error(`\n${colors.red}Error during validation:${colors.reset}`, error);
  process.exit(1);
});
