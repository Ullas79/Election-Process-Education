/**
 * Gemini AI Service - Election Process Education
 * Provides intelligent Q&A about election processes using Google Gemini
 */
import { VertexAI } from '@google-cloud/vertexai';
import { logger } from '../utils/logger.js';

const ELECTION_SYSTEM_PROMPT = `You are an expert Election Education Assistant specializing in the Indian democratic election process. Your role is to help citizens understand:

1. **Election Process**: How elections work in India - from announcement to results
2. **Voter Registration**: How to register, check status, and update voter ID
3. **Types of Elections**: General (Lok Sabha), State (Vidhan Sabha), Local Body (Panchayat/Municipal)
4. **Electoral System**: First-Past-The-Post system, constituencies, delimitation
5. **Election Commission of India (ECI)**: Its role, powers, and responsibilities
6. **Voting Process**: EVMs, VVPAT, postal ballots, election day procedures
7. **Model Code of Conduct**: Rules for parties and candidates during elections
8. **Electoral Rights**: Right to vote, RTI in elections, NOTA option
9. **Election Timeline**: Key dates, phases, counting process
10. **Recent Reforms**: Digital voter ID, remote voting pilots, electoral bonds

Guidelines:
- Always provide accurate, factual information based on Indian electoral law
- Cite relevant articles of the Constitution or acts when applicable
- Be non-partisan - never favor any political party or ideology
- Use simple language accessible to first-time voters
- If unsure about something, clearly state that and suggest official ECI resources
- Keep responses concise but comprehensive (200-400 words ideal)
- Use bullet points and structured formatting for clarity
- Encourage democratic participation and informed voting

Remember: You are an educational tool, not a political commentary platform.`;

let genAI = null;
let model = null;

/**
 * Initialize the Gemini AI client via Vertex AI
 */
export function initializeGemini(projectId, location) {
  if (!projectId || !location) {
    logger.warn('GCP Project ID or Location not provided. AI chat will use fallback responses.');
    return false;
  }

  try {
    const vertexAI = new VertexAI({ project: projectId, location: location });
    model = vertexAI.getGenerativeModel({
      model: 'gemini-3.0-flash',
      systemInstruction: ELECTION_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    });
    logger.info('Vertex AI service initialized successfully with gemini-3.0-flash');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Vertex AI:', error.message);
    return false;
  }
}

/**
 * Generate a response to an election-related question
 * @param {string} userMessage - The user's question
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} AI-generated response
 */
export async function generateResponse(userMessage, conversationHistory = []) {
  if (!model) {
    return getFallbackResponse(userMessage);
  }

  try {
    const chat = model.startChat({
      history: conversationHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();

    logger.info(`Gemini response generated for: "${userMessage.substring(0, 50)}..."`);
    return response;
  } catch (error) {
    logger.error('Gemini API error:', error.message);

    if (error.message?.includes('SAFETY')) {
      return "I'm sorry, but I can't respond to that query as it may involve sensitive content. Please ask me about the election process, voter registration, or how democracy works in India!";
    }

    return getFallbackResponse(userMessage);
  }
}

/**
 * Provide fallback responses when Gemini is unavailable
 * Uses keyword matching for basic election Q&A
 */
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();

  const fallbackResponses = [
    {
      keywords: ['register', 'voter id', 'enroll', 'enrollment'],
      response: `## How to Register as a Voter in India 🗳️

**Eligibility:** Indian citizen, 18+ years of age on the qualifying date.

**Steps to Register:**
1. **Online**: Visit the National Voter Service Portal (voters.eci.gov.in) or use the Voter Helpline App
2. **Fill Form 6**: Complete the application with personal details
3. **Documents Needed**: Age proof, address proof, passport-size photo
4. **Submit**: Upload documents online or submit at your nearest ERO office
5. **Verification**: A Booth Level Officer (BLO) may visit for verification
6. **EPIC Card**: Receive your Elector's Photo Identity Card (EPIC)

**Check Your Status**: Use the Voter Helpline App or call 1950 (toll-free)

*Tip: You can also register by visiting your District Election Officer's office directly.*`,
    },
    {
      keywords: ['evm', 'voting machine', 'vvpat', 'electronic'],
      response: `## Electronic Voting Machines (EVMs) & VVPAT

**What is an EVM?**
An Electronic Voting Machine is a portable device used for casting and counting votes. Introduced by the ECI to eliminate electoral fraud.

**Components:**
- **Ballot Unit**: Where voters press the button next to their chosen candidate
- **Control Unit**: Operated by polling officers to manage the voting process
- **VVPAT**: Voter Verifiable Paper Audit Trail - prints a slip showing your vote for 7 seconds

**Security Features:**
- Stand-alone machines (not connected to any network)
- One-time programmable chips
- Tamper-detection mechanisms
- Sealed and signed by candidates/agents before use
- Randomized distribution to polling booths

**Key Facts:**
- Each EVM can record up to 2,000 votes
- Maximum 16 candidates per Ballot Unit (up to 4 units can be linked)
- Battery operated - works without electricity
- VVPAT mandatory since 2019 for all elections`,
    },
    {
      keywords: ['timeline', 'schedule', 'phases', 'dates', 'when'],
      response: `## Election Timeline & Phases 📅

**Typical General Election Timeline:**

1. **Announcement** (T-45 days): ECI announces election dates and schedule
2. **Model Code of Conduct**: Comes into effect immediately upon announcement
3. **Nomination Filing** (T-30 days): Candidates file nomination papers
4. **Scrutiny** (T-28 days): Returning Officer examines nominations
5. **Withdrawal** (T-25 days): Last date for candidates to withdraw
6. **Campaigning** (T-25 to T-2 days): Active election campaigning
7. **Campaign Silence** (T-2 days): No campaigning 48 hours before polling
8. **Polling Day**: Voting from 7 AM to 6 PM (may vary by region)
9. **Counting** (T+3 days typically): Votes counted at designated centers
10. **Results**: Declared on counting day itself

**Multi-Phase Voting:**
Large states often vote in multiple phases for security management. The 2024 Lok Sabha Elections were held in 7 phases.

*All dates are approximate and vary based on ECI notification.*`,
    },
    {
      keywords: ['nota', 'none of the above', 'reject'],
      response: `## NOTA - None Of The Above

**What is NOTA?**
NOTA is an option on the EVM that allows voters to officially reject all candidates contesting in their constituency.

**Key Points:**
- Introduced in 2013 following Supreme Court directive (PUCL vs Union of India)
- Symbol: A ballot paper with a cross mark
- Available in all elections across India
- Ensures voters' right to reject without revealing identity

**Impact:**
- NOTA votes are counted but don't affect the result
- Even if NOTA gets the highest votes, the candidate with the most votes still wins
- Serves as a protest mechanism and sends a message to political parties

**Fun Fact:** In the 2019 Lok Sabha Elections, over 1.06 crore voters chose NOTA!`,
    },
    {
      keywords: ['election commission', 'eci', 'commissioner'],
      response: `## Election Commission of India (ECI)

**Constitutional Body:** Established under Article 324 of the Indian Constitution.

**Composition:**
- Chief Election Commissioner (CEC)
- Two Election Commissioners
- Appointed by the President of India

**Key Powers & Functions:**
- Conduct free and fair elections
- Prepare and update electoral rolls
- Register political parties and allot symbols
- Enforce Model Code of Conduct
- Set election schedules and polling stations
- Monitor election expenditure
- Resolve election disputes

**Independence:**
- CEC can only be removed through impeachment (like a Supreme Court judge)
- Budget charged to Consolidated Fund of India
- Autonomous in decision-making

**Notable Initiatives:**
- SVEEP (Systematic Voters' Education and Electoral Participation)
- cVIGIL app for reporting violations
- Voter Helpline App
- Accessible Elections for PwD voters`,
    },
    {
      keywords: ['how to vote', 'polling', 'booth', 'cast vote', 'election day'],
      response: `## How to Vote on Election Day 🗳️

**Before You Go:**
- Check your name on the voter list (voters.eci.gov.in or Voter Helpline App)
- Locate your polling station
- Carry a valid photo ID (EPIC, Aadhaar, Passport, DL, etc.)

**At the Polling Station:**
1. **Queue Up**: Join the line at your assigned booth
2. **Identification**: Show your ID to the polling officer
3. **Ink Application**: Indelible ink is applied to your left index finger
4. **Enter the Booth**: You'll be directed to the EVM
5. **Cast Your Vote**: Press the button next to your chosen candidate
6. **Verify on VVPAT**: Check the printed slip (visible for 7 seconds)
7. **Exit**: Leave the polling station

**Important Rules:**
- No phones/cameras allowed inside the booth
- No campaigning within 100m of the polling station
- Voting is from 7 AM to 6 PM (anyone in line by 6 PM can vote)
- You cannot be turned away if your name is on the voter list

**Special Provisions:**
- Priority voting for seniors (80+), PwD, and pregnant women
- Wheelchair ramps and Braille features at polling stations`,
    },
  ];

  for (const entry of fallbackResponses) {
    if (entry.keywords.some((keyword) => lowerMessage.includes(keyword))) {
      return entry.response;
    }
  }

  return `## Ask Me About Elections! 🇮🇳

I can help you learn about the Indian democratic election process. Here are some topics you can ask about:

- 📋 **Voter Registration**: How to register, check status, update details
- 🗳️ **Voting Process**: How EVMs work, VVPAT, polling day procedures
- 📅 **Election Timeline**: Phases, schedule, and key dates
- 🏛️ **Election Commission**: Its role, powers, and independence
- ⚖️ **Electoral System**: FPTP, constituencies, and how winners are decided
- 📜 **Model Code of Conduct**: Rules for parties during elections
- 🚫 **NOTA**: Your right to reject all candidates
- 🗺️ **Types of Elections**: Lok Sabha, Vidhan Sabha, Local Body

*Try asking something specific like "How do I register to vote?" or "What is NOTA?"*`;
}

/**
 * Check if Gemini service is available
 */
export function isGeminiAvailable() {
  return model !== null;
}
