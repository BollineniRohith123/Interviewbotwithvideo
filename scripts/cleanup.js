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

console.log(`${colors.blue}Starting cleanup...${colors.reset}\n`);

try {
  // Remove node_modules
  if (fs.existsSync('node_modules')) {
    console.log(`${colors.yellow}Removing node_modules...${colors.reset}`);
    fs.rmSync('node_modules', { recursive: true, force: true });
  }

  // Remove package-lock.json and pnpm-lock.yaml
  const lockFiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
  lockFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`${colors.yellow}Removing ${file}...${colors.reset}`);
      fs.unlinkSync(file);
    }
  });

  // Clear npm cache
  console.log(`${colors.blue}Clearing package manager cache...${colors.reset}`);
  execSync('pnpm store prune', { stdio: 'inherit' });

  // Remove .next directory
  if (fs.existsSync('.next')) {
    console.log(`${colors.yellow}Removing .next directory...${colors.reset}`);
    fs.rmSync('.next', { recursive: true, force: true });
  }

  console.log(`\n${colors.green}Cleanup completed successfully!${colors.reset}`);
  console.log(`\n${colors.blue}Next steps:${colors.reset}`);
  console.log('1. Run: pnpm install');
  console.log('2. Run: pnpm run setup-proctoring');

} catch (error) {
  console.error(`${colors.red}Error during cleanup:${colors.reset}`, error);
  process.exit(1);
}
