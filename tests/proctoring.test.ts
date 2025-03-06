import { MultimodalLiveClient, ViolationEvent } from '../lib/multimodalLiveClient';
import fetchMock from 'jest-fetch-mock';

describe('MultimodalLiveClient', () => {
  let client: MultimodalLiveClient;
  const testApiUrl = 'https://test-api.example.com';
  const testApiKey = 'test-api-key';

  beforeEach(() => {
    fetchMock.resetMocks();
    client = new MultimodalLiveClient(testApiUrl, testApiKey);
  });

  describe('Initialization', () => {
    test('initializes with correct configuration', () => {
      expect(client).toBeTruthy();
      expect(client.isConnected()).toBeFalsy();
    });
  });

  describe('Connection Management', () => {
    test('connects successfully', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ status: 'healthy' }));

      await client.connect();
      expect(client.isConnected()).toBeTruthy();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('handles connection failure', async () => {
      fetchMock.mockRejectOnce(new Error('Connection failed'));

      await expect(client.connect()).rejects.toThrow('Connection failed');
      expect(client.isConnected()).toBeFalsy();
    });

    test('disconnects properly', () => {
      client.connect();
      client.disconnect();
      expect(client.isConnected()).toBeFalsy();
    });
  });

  describe('Video Frame Processing', () => {
    const testFrame = 'data:image/jpeg;base64,test-image-data';

    beforeEach(async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ status: 'healthy' }));
      await client.connect();
    });

    test('processes video frames', async () => {
      const apiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'PROCTORING_VIOLATION: Looking Away'
            }]
          }
        }]
      };

      fetchMock.mockResponseOnce(JSON.stringify(apiResponse));

      const violationPromise = new Promise<ViolationEvent>(resolve => {
        client.on('violation', resolve);
      });

      await client.sendVideoFrame(testFrame);
      const violation = await violationPromise;

      expect(violation).toBeTruthy();
      expect(violation.type).toBe('Looking Away');
    });

    test('handles frame processing errors', async () => {
      fetchMock.mockRejectOnce(new Error('Frame processing failed'));

      const errorPromise = new Promise(resolve => {
        client.on('error', resolve);
      });

      await client.sendVideoFrame(testFrame);
      const error = await errorPromise;

      expect(error).toBeTruthy();
      expect(error.message).toContain('Frame processing failed');
    });

    test('respects frame rate limits', async () => {
      const apiResponse = { candidates: [{ content: { parts: [] } }] };
      fetchMock.mockResponse(JSON.stringify(apiResponse));

      // Send multiple frames quickly
      await Promise.all([
        client.sendVideoFrame(testFrame),
        client.sendVideoFrame(testFrame),
        client.sendVideoFrame(testFrame)
      ]);

      // Should only make one API call due to rate limiting
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Violation Detection', () => {
    beforeEach(async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ status: 'healthy' }));
      await client.connect();
    });

    test('detects looking away violation', async () => {
      const apiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'PROCTORING_VIOLATION: Looking Away'
            }]
          }
        }]
      };

      fetchMock.mockResponseOnce(JSON.stringify(apiResponse));

      const violations: ViolationEvent[] = [];
      client.on('violation', violation => violations.push(violation));

      await client.sendVideoFrame('data:image/jpeg;base64,test-image');
      
      expect(violations.length).toBe(1);
      expect(violations[0].type).toBe('Looking Away');
    });

    test('detects multiple violations', async () => {
      const apiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: `PROCTORING_VIOLATION: Looking Away
                     PROCTORING_VIOLATION: Multiple Faces Detected`
            }]
          }
        }]
      };

      fetchMock.mockResponseOnce(JSON.stringify(apiResponse));

      const violations: ViolationEvent[] = [];
      client.on('violation', violation => violations.push(violation));

      await client.sendVideoFrame('data:image/jpeg;base64,test-image');
      
      expect(violations.length).toBe(2);
      expect(violations.map(v => v.type)).toEqual(['Looking Away', 'Multiple Faces Detected']);
    });
  });

  describe('Configuration', () => {
    test('sends configuration successfully', () => {
      const config = {
        strictness: 'high',
        frameRate: 1,
        quality: 0.8
      };

      let receivedConfig: any;
      client.on('config', cfg => {
        receivedConfig = cfg;
      });

      client.sendConfig(config);
      expect(receivedConfig).toEqual(config);
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ error: 'API Error' }), { status: 500 });

      const errorPromise = new Promise(resolve => {
        client.on('error', resolve);
      });

      await client.sendVideoFrame('data:image/jpeg;base64,test-image');
      const error = await errorPromise;

      expect(error).toBeTruthy();
    });

    test('handles network errors', async () => {
      fetchMock.mockReject(new Error('Network error'));

      const errorPromise = new Promise(resolve => {
        client.on('error', resolve);
      });

      await client.sendVideoFrame('data:image/jpeg;base64,test-image');
      const error = await errorPromise;

      expect(error).toBeTruthy();
      expect(error.message).toContain('Network error');
    });
  });
});
