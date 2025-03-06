#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const dotenv = require('dotenv');

// Colors for console output
const colors = {
  reset: '[0m',
  red: '[31m',
  green: '[32m',
  yellow: '[33m',
  blue: '[34m'
};

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log(`${colors.blue}Testing Gemini API Integration...${colors.reset}\n`);

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error(`${colors.red}❌ GEMINI_API_KEY not found in .env.local${colors.reset}`);
    process.exit(1);
  }

  // Test the models endpoint first
  const modelsUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  
  console.log(`${colors.blue}1. Testing API Access...${colors.reset}`);
  
  try {
    await new Promise((resolve, reject) => {
      https.get(modelsUrl, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`${colors.green}✓ API Access Successful${colors.reset}`);
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`API returned status code ${res.statusCode}`));
          }
        });
      }).on('error', reject);
    });

    // Test vision model specifically
    console.log(`\n${colors.blue}2. Testing Vision Model...${colors.reset}`);
    
    // Create a small test image (1x1 pixel transparent PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const visionUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent';
    
    const testData = {
      contents: [{
        parts: [{
          inline_data: {
            mime_type: "image/jpeg",
            data: testImageBase64
          }
        }]
      }],
      safety_settings: {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_LOW_AND_ABOVE"
      },
      generationConfig: {
        temperature: 0.1,
        topP: 1,
        topK: 32,
        maxOutputTokens: 256,
      }
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      }
    };

    await new Promise((resolve, reject) => {
      const req = https.request(`${visionUrl}?key=${apiKey}`, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`${colors.green}✓ Vision Model Test Successful${colors.reset}`);
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Vision API returned status code ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(testData));
      req.end();
    });

    console.log(`\n${colors.green}✓ All tests passed successfully!${colors.reset}`);
    console.log(`\n${colors.blue}Next steps:${colors.reset}`);
    console.log('1. Run: pnpm dev');
    console.log('2. Test the video proctoring in your browser');

  } catch (error) {
    console.error(`\n${colors.red}❌ Test failed:${colors.reset}`, error.message);
    console.log(`\n${colors.yellow}Troubleshooting:${colors.reset}`);
    console.log('1. Verify your API key is correct');
    console.log('2. Check if you have enabled the Gemini API in your Google Cloud Project');
    console.log('3. Ensure you have proper network connectivity');
    process.exit(1);
  }
}

testGeminiAPI();
