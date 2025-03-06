'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { startCall, endCall } from '@/lib/callFunctions';
import { demoConfig, createDemoConfig } from './demo-config';
import LanguageSelector from './components/LanguageSelector';
import InterviewModule from './components/InterviewModule';
import { Transcript, Role } from 'ultravox-client';
import InterviewFeedback from './components/InterviewFeedback';
import { PROGRAMMING_LANGUAGES } from '@/lib/constants';
import MicToggleButton from './components/MicToggleButton';

export default function Home() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [status, setStatus] = useState<string>('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcripts
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcripts]);

  useEffect(() => {
    const handleInterviewCompleted = (event: CustomEvent) => {
      console.log('Interview completed:', event.detail);
      // You can use this data to show final feedback or store it
      setShowFeedback(true);
    };

    window.addEventListener('interviewCompleted', handleInterviewCompleted as EventListener);
    return () => {
      window.removeEventListener('interviewCompleted', handleInterviewCompleted as EventListener);
    };
  }, []);

  const handleStartCall = async () => {
    if (!selectedLanguage) {
      alert('Please select a programming language first');
      return;
    }
    
    try {
      setStatus('Initializing call...');
      
      // Create a custom config with the selected language instead of replacing a placeholder
      const customConfig = createDemoConfig(selectedLanguage.toLowerCase());
      
      // Prepare call configuration with only valid fields
      const updatedConfig = {
        systemPrompt: customConfig.callConfig.systemPrompt,
        model: demoConfig.callConfig.model || 'fixie-ai/ultravox-70B',
        languageHint: 'en',
        maxDuration: '3600s',
        timeExceededMessage: 'Interview session has exceeded the maximum duration.',
        temperature: demoConfig.callConfig.temperature,
        voice: demoConfig.callConfig.voice,
        selectedTools: demoConfig.callConfig.selectedTools
      };
      
      await startCall(
        {
          onTranscriptChange: (newTranscripts) => {
            if (newTranscripts) {
              // Filter out any function calls or technical details from transcripts
              const filteredTranscripts = newTranscripts.map(transcript => {
                // Create a clean copy of the transcript
                const cleanedTranscript = { ...transcript };
                
                // Check if the transcript text contains function call patterns
                if (cleanedTranscript.text) {
                  // Remove any JSON function call patterns that might be accidentally included in response
                  cleanedTranscript.text = cleanedTranscript.text.replace(/\{\"type\"\s*:\s*\"function\"[^}]*\}\}/g, '');
                  cleanedTranscript.text = cleanedTranscript.text.replace(/\{\"function\"[^}]*\}\}/g, '');
                  
                  // Remove any captureInterviewData mentions
                  cleanedTranscript.text = cleanedTranscript.text.replace(/captureInterviewData[^}]*\}/g, '');
                  
                  // Clean up any leftover artifacts or multiple spaces
                  cleanedTranscript.text = cleanedTranscript.text.replace(/\s+/g, ' ').trim();
                }
                
                return cleanedTranscript;
              });
              
              setTranscripts(filteredTranscripts);
              
              // Reset status once we get first transcript
              if (filteredTranscripts.length && status === 'Initializing call...') {
                setStatus('Connected');
                setIsCallActive(true);
              }
            }
          },
          onStatusChange: (newStatus) => {
            const statusText = newStatus || '';
            setStatus(statusText);
            
            // Handle different status conditions
            if (statusText.toLowerCase().includes('error')) {
              console.error('Call status error:', statusText);
              setIsCallActive(false);
              // Show user-friendly error
              alert('Error during interview: ' + statusText);
            } else if (statusText.toLowerCase().includes('connected') || 
                      statusText.toLowerCase() === 'connected' || 
                      statusText.toLowerCase() === 'in_call' || 
                      statusText === 'IN_CALL') {
              setIsCallActive(true);
            }
          },
          onDebugMessage: (msg) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Debug:', msg);
            }
          }
        },
        updatedConfig,
        process.env.NODE_ENV === 'development' // Only show debug messages in development
      );
      
      // Ensure call is marked as active after starting
      setIsCallActive(true);
    } catch (error) {
      console.error('Failed to start interview:', error);
      setStatus('Failed to start interview');
      setIsCallActive(false);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to start interview. ';
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage += 'There is a configuration issue. Please contact support.';
        } else {
          errorMessage += error.message;
        }
      }
      alert(errorMessage);
    }
  };

  const handleEndCall = async () => {
    try {
      await endCall();
      setIsCallActive(false);
      setStatus('');
      setShowFeedback(true);
    } catch (error) {
      console.error('Failed to end interview:', error);
    }
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setShowFeedback(false);
    // Reset any previous call data if changing language
    if (isCallActive) {
      handleEndCall();
    }
  };

  return (
    <main className="min-h-screen bg-neutral-bg overflow-hidden relative">
      {/* Decorative Shapes */}
      <div className="fixed top-1/4 -right-24 w-64 h-64 rounded-full bg-gradient-to-r from-deep-purple/10 to-lavender/20 blur-3xl"></div>
      <div className="fixed bottom-1/4 -left-24 w-52 h-52 rounded-full bg-gradient-to-r from-accent-yellow/10 to-salmon/10 blur-3xl"></div>
      <div className="fixed top-3/4 left-1/2 transform -translate-x-1/2 w-72 h-72 rounded-full bg-gradient-radial from-soft-blue/5 to-transparent blur-3xl"></div>
      
      {/* Header with Enhanced Purple Gradient */}
      <div className="bg-gradient-to-r from-deep-purple to-medium-purple border-b shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC01aDR2MWgtNHYtMXptMC01aDR2MWgtNHYtMXptMTIgMTBoLTR2MWg0di0xem0wLTVoLTR2MWg0di0xem0wLTVoLTR2MWg0di0xem0tMjIgMTBoLTV2MWg1di0xem0wLTVoLTV2MWg1di0xem0wLTVoLTV2MWg1di0xem0xMCAwaDR2MWgtNHYtMXptNSAwaDF2MmgtMXYtMnptLTUtNWg0djFoLTR2LTF6bTUgMGgxdjJoLTF2LTJ6bS01LTVoNHYxaC00di0xem01IDBoMXYyaC0xdi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-60"></div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="flex items-center justify-center py-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-salmon to-accent-yellow opacity-30 blur-sm rounded-lg"></div>
              <h1 className="text-3xl font-bold text-white text-center px-8 py-2 relative">
                Tezhire Interview Bot
              </h1>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content with Animation */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative animate-[fadeIn_0.6s_ease-in]">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section - Interview Module (70%) */}
          <div className="w-full lg:w-[70%] transform transition-all duration-500 hover:translate-y-[-5px]">
            <div className="card-gradient backdrop-blur-sm relative overflow-hidden">
              {/* Decorative Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-deep-purple via-salmon to-accent-yellow"></div>
              
              <LanguageSelector 
                languages={PROGRAMMING_LANGUAGES}
                selectedLanguage={selectedLanguage}
                onSelectLanguage={handleLanguageSelect}
                disabled={isCallActive}
              />
              
              <div className="mt-8">
                {selectedLanguage ? (
                  <InterviewModule 
                    language={selectedLanguage}
                    isActive={isCallActive}
                  />
                ) : (
                  <div className="text-center p-12 border-2 border-dashed border-lavender rounded-lg bg-neutral-bg/50">
                    <div className="transform transition-transform hover:scale-105 duration-300">
                      <div className="w-24 h-24 rounded-full bg-lavender mx-auto mb-6 flex items-center justify-center">
                        <span className="text-4xl">💻</span>
                      </div>
                      <p className="text-gradient-purple text-lg font-medium">Please select a programming language to begin</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Section - Interview Controls (30%) */}
          <div className="w-full lg:w-[30%] space-y-8">
            {/* Interview Controls */}
            <div className="card-gradient backdrop-blur-sm relative">
              {/* Decorative Corner Element */}
              <div className="absolute top-0 right-0 w-12 h-12">
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[48px] border-r-[48px] border-t-transparent border-r-medium-purple/20"></div>
              </div>
              
              <h2 className="text-xl font-bold text-gradient-purple relative inline-block mb-6">
                Interview Session
              </h2>
              
              {/* Call Controls with Enhanced Animation */}
              <div className="mb-6 space-y-4">
                {!isCallActive ? (
                    <button
                      data-testid="start-interview-button"
                      onClick={handleStartCall}
                      disabled={!selectedLanguage}
                      className={`w-full px-4 py-4 rounded-lg transition-all ${
                      !selectedLanguage 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'btn-primary pulse'
                    } flex items-center justify-center gap-3 group`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animated-icon scale-icon">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                    <span className="font-medium text-base group-hover:tracking-wider transition-all">Start Interview</span>
                  </button>
                ) : (
                  <>
                    {/* Audio Controls */}
                    <div className="flex gap-3 mb-4">
                      <MicToggleButton role={Role.USER} />
                      <MicToggleButton role={'ASSISTANT' as Role} />
                    </div>
                    {/* End Call Button */}
                    <button
                      data-testid="end-interview-button"
                      onClick={handleEndCall}
                      className="btn-danger w-full flex items-center justify-center gap-3 group py-4"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animated-icon rotate-icon">
                        <path d="M16 2v5h5"/>
                        <path d="M21 6l-4-4"/>
                        <path d="M3 3l18 18"/>
                        <path d="M12 1a3 3 0 0 0-3 3v8"/>
                        <path d="M15 12V4"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      </svg>
                      <span className="font-medium text-base group-hover:tracking-wider transition-all">End Interview</span>
                    </button>
                  </>
                )}
              </div>
              
              {/* Call Status with Animation */}
              {status && (
                <div data-testid="call-status" className={`text-sm mb-6 p-3 rounded-lg transition-all duration-300 ${
                  status.toLowerCase().includes('error') 
                    ? 'bg-red-100/70 text-red-700 border-l-4 border-red-500'
                    : status.toLowerCase().includes('connected')
                    ? 'bg-green-100/70 text-green-700 border-l-4 border-green-500'
                    : 'bg-lavender/70 text-deep-purple border-l-4 border-medium-purple'
                } animate-[fadeIn_0.3s_ease-in]`}>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      status.toLowerCase().includes('error') 
                        ? 'bg-red-500'
                        : status.toLowerCase().includes('connected')
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-medium-purple animate-pulse'
                    }`}></div>
                    {status}
                  </div>
                </div>
              )}
              
              {/* Conversation */}
              <div>
                <h3 className="text-md font-medium text-deep-purple mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Interview Transcript
                </h3>
                <div 
                  ref={transcriptRef}
                  className="h-80 overflow-y-auto scrollbar-visible bg-neutral-bg/60 backdrop-blur-sm rounded-lg p-4 space-y-3 border border-lavender shadow-inner"
                >
                  {transcripts.length === 0 ? (
                    <div className="text-medium-purple text-center h-full flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-lavender/30 flex items-center justify-center mb-4">
                        {selectedLanguage ? (
                          <span className="dot-typing"></span>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-medium-purple">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        )}
                      </div>
                      <p className="text-sm">
                        {selectedLanguage 
                          ? 'Start your interview by clicking the button above!' 
                          : 'Select a programming language to begin'}
                      </p>
                    </div>
                  ) : (
                    transcripts.map((transcript, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg message-animation ${
                          transcript.speaker === 'agent' 
                            ? 'bg-deep-purple/10 text-deep-purple mr-4' 
                            : 'bg-medium-purple/10 text-deep-purple ml-4'
                        } shadow-sm`}
                      >
                        <div className="flex items-center mb-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs ${
                            transcript.speaker === 'agent' 
                              ? 'bg-medium-purple text-white' 
                              : 'bg-salmon text-white'
                          }`}>
                            {transcript.speaker === 'agent' ? 'AI' : 'U'}
                          </div>
                          <span className="text-xs font-bold opacity-80">
                            {transcript.speaker === 'agent' ? 'Interviewer' : 'You'}
                          </span>
                        </div>
                        <p className="text-sm pl-8">{transcript.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 progress-bar">
                <div className="progress-bar-value" style={{ width: isCallActive ? '60%' : '0%' }}></div>
              </div>
            </div>
            
            {/* Feedback Section with Animation */}
            {showFeedback && (
              <div className="card-gradient animate-[slideInUp_0.5s_ease-out] relative backdrop-blur-sm">
                {/* Decorative Element */}
                <div className="absolute -top-3 right-6 transform -rotate-12">
                  <div className="bg-accent-yellow text-deep-purple text-xs px-2 py-1 rounded shadow-md">
                    Interview Complete!
                  </div>
                </div>
                <InterviewFeedback 
                  language={selectedLanguage} 
                  transcripts={transcripts} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-12 py-4 border-t border-lavender/30 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-xs text-medium-purple">
          <p>© 2023 Tezhire. All rights reserved.</p>
          <p>Powered by <span className="text-deep-purple font-medium">Ultravox AI</span></p>
        </div>
      </footer>
    </main>
  );
}
