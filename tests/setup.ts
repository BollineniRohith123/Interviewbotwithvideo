import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';

// Enable fetch mocking
fetchMock.enableMocks();

// Configure default fetch mock behavior
beforeEach(() => {
  fetchMock.resetMocks();
});

// Configure longer timeout for tests
jest.setTimeout(30000);

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_GEMINI_API_URL: 'https://test-api.example.com',
  NEXT_PUBLIC_GEMINI_API_KEY: 'test-key',
};

// Mock logger to prevent console output during tests
jest.mock('../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock EventEmitter
jest.mock('eventemitter3', () => {
  return class MockEventEmitter {
    listeners = new Map();
    on(event: string, callback: Function) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
    emit(event: string, ...args: any[]) {
      const callbacks = this.listeners.get(event) || [];
      callbacks.forEach((callback: Function) => callback(...args));
    }
    off(event: string, callback: Function) {
      const callbacks = this.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
    removeAllListeners() {
      this.listeners.clear();
    }
  };
});

// Add custom matchers
expect.extend({
  toBeValidViolation(received) {
    const pass = received && 
                typeof received.type === 'string' &&
                typeof received.timestamp === 'string' &&
                typeof received.confidence === 'number';
                
    return {
      pass,
      message: () => pass
        ? 'Expected violation to not be valid'
        : 'Expected violation to be valid with type, timestamp, and confidence',
    };
  },
});

// Global type declarations
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidViolation(): R;
    }
  }
}
