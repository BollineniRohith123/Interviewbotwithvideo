import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

describe('Interview Flow Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--use-fake-ui-for-media-stream'] // Allow camera access
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Basic Interview Flow', async () => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the language selector to be visible
    await page.waitForSelector('[data-testid="language-selector"]');
    
    // Wait for JavaScript option to be visible and click it
    await page.waitForSelector('[data-testid="language-option-javascript"]');
    await page.click('[data-testid="language-option-javascript"]');
    
    // Wait for start button to be enabled (not disabled)
    await page.waitForSelector('[data-testid="start-interview-button"]:not([disabled])');
    
    // Start the interview
    await page.click('[data-testid="start-interview-button"]');
    
    // Wait for the interview to initialize
    await page.waitForSelector('[data-testid="call-status"]');
    
    // Verify video proctor is active
    const videoProctor = await page.$('[data-testid="video-proctor"]');
    expect(videoProctor).toBeTruthy();
    
    // End the interview
    await page.click('[data-testid="end-interview-button"]');
    
    // Verify feedback is shown
    await page.waitForSelector('[data-testid="interview-feedback"]');
  }, 30000); // 30 second timeout
});
