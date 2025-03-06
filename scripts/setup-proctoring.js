#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}Starting setup for video proctoring integration...${colors.reset}\n`);

function runCommand(command, errorMessage) {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${colors.red}${errorMessage}${colors.reset}`);
    console.error(`${colors.yellow}Error details: ${error.message}${colors.reset}\n`);
    return false;
  }
}

async function setup() {
  // Step 1: Check if .env.local exists
  if (!fs.existsSync('.env.local')) {
    console.log(`${colors.blue}Creating .env.local from .env.example...${colors.reset}`);
    fs.copyFileSync('.env.example', '.env.local');
    console.log(`${colors.green}✓ Created .env.local${colors.reset}\n`);
  }

  // Step 2: Install dependencies using PNPM
  console.log(`${colors.blue}Installing dependencies...${colors.reset}`);
  if (!runCommand('pnpm install', 'Failed to install dependencies')) {
    return false;
  }
  console.log(`${colors.green}✓ Dependencies installed${colors.reset}\n`);

  // Step 3: Create required directories if they don't exist
  const directories = [
    'app/api/gemini',
    'lib/middleware',
    'scripts'
  ];

  console.log(`${colors.blue}Creating required directories...${colors.reset}`);
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`${colors.green}✓ Created ${dir}${colors.reset}`);
    }
  });

  // Step 4: Make check-proctoring script executable
  console.log(`\n${colors.blue}Setting up check-proctoring script...${colors.reset}`);
  try {
    fs.chmodSync('scripts/check-proctoring.js', '755');
    console.log(`${colors.green}✓ Made check-proctoring.js executable${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Failed to make script executable${colors.reset}`);
    console.error(error);
  }

  // Step 5: Check for required environment variables
  console.log(`${colors.blue}Checking environment variables...${colors.reset}`);
  const requiredEnvVars = [
    'GEMINI_API_KEY',
    'GOOGLE_CLOUD_PROJECT'
  ];

  const missingVars = [];
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log(`${colors.yellow}Warning: The following environment variables need to be set in .env.local:${colors.reset}`);
    missingVars.forEach(varName => {
      console.log(`  - ${varName}`);
    });
  } else {
    console.log(`${colors.green}✓ All required environment variables are set${colors.reset}`);
  }

  // Step 6: Run type checking
  console.log(`\n${colors.blue}Running type check...${colors.reset}`);
  if (!runCommand('pnpm tsc --noEmit', 'Type check failed')) {
    console.log(`${colors.yellow}Please fix type errors before proceeding${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Type check passed${colors.reset}`);
  }

  console.log(`\n${colors.green}Setup completed!${colors.reset}`);
  
  if (missingVars.length > 0) {
    console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
    console.log('1. Add missing environment variables to .env.local');
    console.log('2. Run npm run check-proctoring to verify the setup');
  } else {
    console.log(`\n${colors.blue}You can now run:${colors.reset}`);
    console.log('npm run check-proctoring');
  }
}

setup().catch(error => {
  console.error(`${colors.red}Setup failed:${colors.reset}`, error);
  process.exit(1);
});
