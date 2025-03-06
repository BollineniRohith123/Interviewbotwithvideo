'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { MultimodalLiveClient, ViolationEvent } from '../multimodalLiveClient';
import { logger } from '../logger';

interface LiveAPIContextType {
  client: MultimodalLiveClient | null;
  connected: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendConfig: (config: any) => void;
}

const LiveAPIContext = createContext<LiveAPIContextType>({
  client: null,
  connected: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
  sendConfig: () => {},
});

export const useLiveAPI = () => useContext(LiveAPIContext);

interface LiveAPIProviderProps {
  children: React.ReactNode;
  apiUrl?: string;
  apiKey?: string;
  onViolation?: (violation: ViolationEvent) => void;
}

export const LiveAPIProvider: React.FC<LiveAPIProviderProps> = ({
  children,
  apiUrl = process.env.NEXT_PUBLIC_GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta',
  apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  onViolation,
}) => {
  const [client, setClient] = useState<MultimodalLiveClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize client
  useEffect(() => {
    if (!apiKey) {
      setError(new Error('API key not provided'));
      return;
    }

    try {
      const newClient = new MultimodalLiveClient(apiUrl, apiKey);

      // Set up event listeners
      newClient.on('open', () => {
        setConnected(true);
        setError(null);
        logger.info('Connected to Gemini API');
      });

      newClient.on('close', () => {
        setConnected(false);
        logger.info('Disconnected from Gemini API');
      });

      newClient.on('error', (err: Error) => {
        setError(err);
        logger.error('Gemini API error:', err);
      });

      if (onViolation) {
        newClient.on('violation', onViolation);
      }

      setClient(newClient);

      // Cleanup
      return () => {
        newClient.removeAllListeners();
        if (newClient.isConnected()) {
          newClient.disconnect();
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize client'));
      logger.error('Failed to initialize client:', err);
    }
  }, [apiUrl, apiKey, onViolation]);

  // Connect handler
  const connect = useCallback(async () => {
    if (!client) {
      throw new Error('Client not initialized');
    }

    try {
      await client.connect();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Connection failed'));
      throw err;
    }
  }, [client]);

  // Disconnect handler
  const disconnect = useCallback(() => {
    if (client && client.isConnected()) {
      client.disconnect();
    }
  }, [client]);

  // Configuration handler
  const sendConfig = useCallback((config: any) => {
    if (client && client.isConnected()) {
      client.sendConfig(config);
    } else {
      logger.warn('Cannot send config: client not connected');
    }
  }, [client]);

  const value = {
    client,
    connected,
    error,
    connect,
    disconnect,
    sendConfig,
  };

  return (
    <LiveAPIContext.Provider value={value}>
      {children}
    </LiveAPIContext.Provider>
  );
};
