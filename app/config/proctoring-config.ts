/**
 * Configuration for the video proctoring system
 */

// Base system prompt for the proctoring model
export const getProctoringSystemPrompt = (options: {
  strictness?: 'low' | 'medium' | 'high';
} = {}): string => {
  const { strictness = 'medium' } = options;
  
  // Adjust thresholds based on strictness
  const thresholds = {
    lookingAway: strictness === 'high' ? 2 : strictness === 'medium' ? 3 : 5,
    multiplePersons: 1, // Always strict for multiple persons
    lowEngagement: strictness === 'high' ? 10 : strictness === 'medium' ? 15 : 20,
    suspiciousMovement: strictness === 'high' ? 'frequent' : strictness === 'medium' ? 'repeated' : 'excessive',
  };

  return `
## Video Proctoring Instructions - HIGH PRIORITY
You are acting as a proctor monitoring the video stream of an interview.
Analyze the video feed for the following potential violations during the interview.
Respond ONLY with text-based violation logs if you detect any, otherwise, stay silent.
Do not interrupt the interview flow with verbal warnings; only log violations TEXTUALLY.

**Violation Detection Criteria:**

1. **User Attention:**
   - Monitor if the user looks away from the screen for extended periods (more than ${thresholds.lookingAway} seconds).
   - Log as: "PROCTORING_VIOLATION: Looking Away"

2. **Multiple Faces:**
   - Count the number of faces in the frame. 
   - If more than one face is consistently detected, log: 
   - "PROCTORING_VIOLATION: Multiple Faces Detected"

3. **User Engagement:**
   - Detect if the user appears distracted, tired, or disengaged for more than ${thresholds.lowEngagement} seconds.
   - Log as: "PROCTORING_VIOLATION: Low Engagement"

4. **Suspicious Behavior:**
   - Note any ${thresholds.suspiciousMovement} suspicious movements like frequently looking off-screen.
   - Log as: "PROCTORING_VIOLATION: Suspicious Movement - [specify movement]"

5. **Unauthorized Devices:**
   - Detect if phones or other devices are visible in the frame.
   - Log as: "PROCTORING_VIOLATION: Unauthorized Device"

**Important Guidelines:**
- Only report clear violations with high confidence to minimize false positives
- Do not verbally address violations with the user during the interview
- Each violation message must start with "PROCTORING_VIOLATION:" for proper processing
- If there are no violations, do not generate any messages
`;
};

// Default configuration for the proctoring system
export const getDefaultProctoringConfig = (options: {
  strictness?: 'low' | 'medium' | 'high';
} = {}) => {
  return {
    // System prompt for proctoring
    systemPrompt: getProctoringSystemPrompt(options),
    
    // Temperature (lower values are more deterministic)
    temperature: 0.2,
    
    // Max output tokens (keep minimal for faster responses)
    maxOutputTokens: 256,
    
    // Detection thresholds
    detectionThresholds: {
      lookingAway: options.strictness === 'high' ? 0.7 : options.strictness === 'medium' ? 0.8 : 0.9,
      multiplePersons: 0.85,
      lowEngagement: options.strictness === 'high' ? 0.75 : options.strictness === 'medium' ? 0.85 : 0.9,
      suspiciousActivity: options.strictness === 'high' ? 0.7 : options.strictness === 'medium' ? 0.8 : 0.9,
    }
  };
};

// Gemini Live API URL
export const GEMINI_LIVE_API_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent";