import './globals.css';
import type { Metadata } from 'next';
import { LiveAPIProvider } from '../lib/contexts/LiveAPIContext';
import { GEMINI_LIVE_API_URL } from './config/proctoring-config';

export const metadata: Metadata = {
  title: 'Ultravox Interactive AI Interview',
  description: 'Interactive AI interview platform powered by Ultravox',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use environment variable for API key
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  return (
    <html lang="en">
      <body>
        <LiveAPIProvider 
          url={GEMINI_LIVE_API_URL} 
          apiKey={apiKey}
        >
          {children}
        </LiveAPIProvider>
      </body>
    </html>
  );
}
