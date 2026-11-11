const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const { AssemblyAI } = require('assemblyai');
// CORRECTED: Import the official Google Generative AI package
const { GoogleGenerativeAI } = require('@google/generative-ai');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Multer setup for file uploads ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors({ origin: ['https://crisp-assistant.vercel.app', 'http://localhost:5173', 'https://crisp-ai-three.vercel.app'] }));
app.use(express.json());

// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/candidates', candidateRoutes);

// --- API Clients ---

// CORRECTED: Initialize the official Google Gemini AI Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const assemblyClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

// --- Helper function for polling AssemblyAI ---
const pollTranscript = async (transcriptId) => {
  const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
  while (true) {
    const pollingResponse = await axios.get(pollingEndpoint, {
      headers: { authorization: process.env.ASSEMBLYAI_API_KEY }
    });
    const transcript = pollingResponse.data;
    if (transcript.status === 'completed') {
      return transcript;
    } else if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds before polling again
  }
};

// --- API Endpoints ---

// 1. Resume Upload Endpoint (Your APILayer implementation)
app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }
  
  const apiKey = process.env.APILAYER_API_KEY;
  if (!apiKey) {
    console.error("APILayer API Key not found in .env file.");
    // Fallback to null data if API key is missing
    return res.json({ success: true, data: { name: null, email: null, phone: null } });
  }

  try {
    const response = await axios.post('https://api.apilayer.com/resume_parser/upload', req.file.buffer, {
      headers: {
        'apikey': apiKey,
        'Content-Type': req.file.mimetype
      }
    });
    const { name, email, phone } = response.data;
    res.json({ success: true, data: { name: name || null, email: email || null, phone: phone || null } });
  } catch (error) {
    console.error('Error calling APILayer:', error.response ? error.response.data : error.message);
    // Fallback to null data on error
    res.json({ success: true, data: { name: null, email: null, phone: null } });
  }
});

// 2. Generate Question Endpoint (FIXED)
// 2. Generate Question Endpoint (FIXED)
app.post('/api/generate-question', async (req, res) => {
  const { difficulty, time_limit } = req.body;

  const prompt = `
## Persona
You are a senior hiring manager at a top tech company conducting a rapid screening interview. Your goal is to ask clear, concise, and direct technical questions.

## Task
Your task is to generate a single, high-quality interview question for a Full Stack (React/Node.js) role with a difficulty level of **${difficulty}**.

## Strict Constraints
1.  **EXTREME CONCISENESS:** The question text MUST be direct and to the point. It should be readable in under 10 seconds. AVOID long introductory stories, complex scenarios, or unnecessary setup. Get straight to the technical concept.
2.  **TIME-BOXED SCOPE:** The scope of the question MUST be narrow enough that a knowledgeable candidate could formulate and deliver a complete verbal answer within the given time limit of **${time_limit} seconds**. Do not ask questions that require extensive thought or multiple parts.
3.  **CLEAR CLASSIFICATION:** You must classify the question as either 'conceptual' (for verbal answers) or 'problem-solving' (for written/code answers).

## Examples of Good vs. Bad Questions

### Example for 'Easy' difficulty:
-   **GOOD (Concise & Time-Appropriate):** "What is the difference between 
let\n and 
const\n in JavaScript?"
-   **BAD (Too Long & Story-Based):** "Imagine you are building a social media app where users can post updates. You need to store the user's name, which never changes, and their latest post, which changes frequently. Should you use 
let\n or 
const\n for these variables and why does it matter for the app's performance?"

### Example for 'Medium' difficulty:
-   **GOOD (Concise & Time-Appropriate):** "Can you explain the purpose of the 
useEffect\n hook in React and provide one common use case?"
-   **BAD (Too Broad for 60 seconds):** "Describe the entire component lifecycle in React, including all the legacy methods from class components and how they map to modern hooks, and discuss the performance implications of each."

## Final Output Format
Your response MUST be ONLY a valid JSON object with two keys: "questionText" and "questionType". Do not include any other text, explanations, or markdown formatting.
`;

  try {
    // Get the specific model with JSON output configuration
    const model = genAI.getGenerativeModel({
        model: "gemini-3.8-flash",
        generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const questionObject = JSON.parse(text);
    
    res.json(questionObject); 
  } catch (error) {
    console.error("Error calling Gemini AI:", error);
    res.status(500).json({ error: 'Failed to generate question from AI service.', details: error.message });
  }
});

// 3. Evaluate Interview Endpoint (FIXED)
app.post('/api/evaluate-interview', async (req, res) => {
  const { transcript } = req.body;

  const transcriptString = transcript.map(item => {
    let entry = `Q: ${item.question.questionText}\nA: ${item.answer.text}`; // Adjusted to access questionText
    if (item.answer.analysis) {
        const { sentiment, confidence, filler_word_count } = item.answer.analysis;
        entry += `\n[Vocal Analysis: Sentiment: ${sentiment}, Confidence: ${(confidence * 100).toFixed(0)}%, Filler Words: ${filler_word_count}]`;
    }
    return entry;
  }).join('\n\n');

  const prompt = `You are an expert interviewer for a Full Stack role. Below is an interview transcript. For each answer, vocal analysis data (sentiment, confidence, filler words) may be provided.\n\nYour task is to:\n1. Evaluate the technical accuracy and depth of the answers.\n2. Evaluate the candidate's communication skills using the provided vocal analysis. Comment on their clarity, confidence, and professionalism.\n3. Provide a final score out of 100.\n4. Write a 3-4 sentence summary of the candidate's overall performance, integrating both technical and communication feedback.\n\nReturn your response ONLY as a valid JSON object with two keys: "score" (as a number) and "summary" (as a string).\n\nTranscript:\n${transcriptString}`;

  try {
    // Get the specific model with JSON output configuration
    const model = genAI.getGenerativeModel({
        model: "gemini-3.8-flash",
        generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const aiResponse = JSON.parse(text);

    res.json(aiResponse);
  } catch (error) {
    console.error("Error calling Gemini AI for evaluation:", error);
    res.status(500).json({ error: 'Failed to evaluate interview from AI service.', details: error.message });
  }
});

// 4. Analyze Audio Endpoint
app.post('/api/analyze-audio', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }

  try {
    const uploadUrl = await assemblyClient.files.upload(req.file.buffer);
    const transcript = await assemblyClient.transcripts.create({
      audio_url: uploadUrl,
      sentiment_analysis: true,
      disfluencies: true,
    });
    
    const completedTranscript = await pollTranscript(transcript.id);

    const fillerWords = completedTranscript.words.filter(word => word.word_type === 'filler');
    const analysis = {
      sentiment: completedTranscript.sentiment_analysis_results?.map(r => r.sentiment).join(', ') || 'NEUTRAL',
      confidence: completedTranscript.confidence,
      filler_word_count: fillerWords.length,
      filler_words: fillerWords.map(w => w.text),
    };
    res.json(analysis);
  } catch (error) {
    console.error("Error with AssemblyAI analysis:", error);
    res.status(500).json({ error: 'Failed to analyze audio.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
