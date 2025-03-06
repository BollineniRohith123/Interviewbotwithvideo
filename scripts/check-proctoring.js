#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

function checkEnvironment() {
  console.log('\n🔍 Checking Proctoring Configuration...\n');
  let hasErrors = false;

  // Required environment variables
  const requiredVars = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT
  };

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      console.error(`❌ ${key} is missing`);
      hasErrors = true;
    } else {
      console.log(`✅ ${key} is configured`);
    }
  }

  // Check file existence
  const requiredFiles = [
    'app/api/gemini/route.ts',
    'lib/multimodalLiveClient.ts',
    'app/components/VideoProctor.tsx',
    'middleware.ts'
  ];

  console.log('\n📁 Checking required files...\n');

  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      console.log(`✅ ${file} exists`);
    } else {
      console.error(`❌ ${file} is missing`);
      hasErrors = true;
    }
  }

  // Test API key validity
  console.log('\n🔑 Testing Gemini API key...\n');
  
  const testGeminiAPI = () => {
    return new Promise((resolve) => {
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

      https.get(url, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Gemini API key is valid');
          resolve(true);
        } else {
          console.error(`❌ Gemini API key validation failed (Status: ${res.statusCode})`);
          hasErrors = true;
          resolve(false);
        }
      }).on('error', (err) => {
        console.error('❌ Gemini API connection error:', err.message);
        hasErrors = true;
        resolve(false);
      });
    });
  };

  // Run API test and show summary
  testGeminiAPI().then(() => {
    console.log('\n📋 Configuration Summary:\n');
    if (hasErrors) {
      console.error('❌ Configuration has errors. Please fix them before proceeding.');
      process.exit(1);
    } else {
      console.log('✅ All checks passed! Video proctoring is properly configured.');
    }
  });
}

// Add to package.json scripts
const updatePackageJson = () => {
  const packagePath = path.join(process.cwd(), 'package.json');
  const package = require(packagePath);
  
  package.scripts = package.scripts || {};
  package.scripts['check-proctoring'] = 'node scripts/check-proctoring.js';
  
  fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));
  console.log('\n📝 Added check-proctoring script to package.json\n');
};

// Run everything
try {
  checkEnvironment();
  updatePackageJson();
} catch (error) {
  console.error('\n❌ Error during configuration check:', error);
  process.exit(1);
}
