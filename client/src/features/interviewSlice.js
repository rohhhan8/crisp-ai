import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { generateQuestion, getInterviewFeedback } from '../services/aiService';

// Index of the question currently being fetched (guards against duplicate requests).
let inFlightIndex = null;

export const fetchQuestion = createAsyncThunk(
  'interview/fetchQuestion',
  async ({ difficulty, time, index }, { rejectWithValue }) => {
    inFlightIndex = index;
    try {
      const questionData = await generateQuestion(difficulty, time);
      if (!questionData || !questionData.questionText) {
        throw new Error('No question received from server.');
      }
      return { question: questionData, time, index };
    } catch (error) {
      return rejectWithValue(error.message);
    } finally {
      inFlightIndex = null;
    }
  },
  {
    // Never fetch a question we already have, or one that is already being fetched.
    condition: ({ index }, { getState }) => {
      const { interviewQuestions } = getState().interview;
      return interviewQuestions.length <= index && inFlightIndex !== index;
    },
  }
);

export const evaluateInterview = createAsyncThunk(
  'interview/evaluateInterview',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { interviewQuestions, answers } = getState().interview;
      // Pass the entire answer object, including analysis, to the backend.
      const transcript = interviewQuestions.map((q, i) => ({
        question: q.questionText,
        answer: answers[i] || { text: '', analysis: null }, // Ensure a consistent object structure
      }));
      const feedback = await getInterviewFeedback(transcript);
      return feedback;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const REQUIRED_FIELDS = ['name', 'email', 'phone'];
const missingFields = (details) => REQUIRED_FIELDS.filter((field) => !details[field]);

const beginInterview = (state) => {
  state.status = 'in_progress';
  state.messages.push({ text: "Great, I have all your details. Let's begin the interview.", sender: 'bot' });
};

const initialState = {
  candidateDetails: { name: null, email: null, phone: null },
  resumeUploaded: false,
  messages: [],
  status: 'gathering_info',
  isGeneratingQuestion: false,
  interviewQuestions: [],
  answers: [], // Will now hold objects { text: string, analysis: object | null }
  currentQuestionIndex: 0,
  timer: 0,
  error: null, // Add error field
  finalScore: null,
  finalSummary: null,
};

export const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    // Called once after the resume is parsed. Greets the user and asks for ONE missing detail
    // (or starts the interview straight away if nothing is missing).
    setCandidateDetails: (state, action) => {
      state.candidateDetails = { ...state.candidateDetails, ...action.payload };
      state.resumeUploaded = true;
      const missing = missingFields(state.candidateDetails);
      if (missing.length === 0) {
        beginInterview(state);
      } else {
        state.status = 'gathering_info';
        state.messages.push({ text: 'Hello! Thanks for uploading your resume.', sender: 'bot' });
        state.messages.push({ text: `I couldn't find your ${missing[0]}. Could you please provide it?`, sender: 'bot' });
      }
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    // The user's reply to "please provide your <field>". One action = one user message
    // and exactly one bot reply, so questions can never double up.
    submitDetail: (state, action) => {
      const value = String(action.payload || '').trim();
      if (!value || state.status !== 'gathering_info') return;
      const missing = missingFields(state.candidateDetails);
      if (missing.length === 0) return;
      state.messages.push({ text: value, sender: 'user' });
      state.candidateDetails[missing[0]] = value;
      const remaining = missingFields(state.candidateDetails);
      if (remaining.length > 0) {
        state.messages.push({ text: `Thanks! Now, could you please provide your ${remaining[0]}?`, sender: 'bot' });
      } else {
        beginInterview(state);
      }
    },
    // Fallback for state saved by an older version of the app.
    startInterview: (state) => {
      if (state.status === 'details_confirmed') beginInterview(state);
    },
    submitAnswer: (state, action) => {
      // The payload is now an object: { text: string, analysis: object | null }
      state.answers.push(action.payload);
      if (state.currentQuestionIndex < 5) {
        state.currentQuestionIndex += 1;
      } else {
        state.status = 'finished';
      }
    },
    decrementTimer: (state) => {
      if (state.timer > 0) {
        state.timer -= 1;
      }
    },
    resetInterview: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestion.pending, (state) => {
        state.isGeneratingQuestion = true;
        state.error = null;
      })
      .addCase(fetchQuestion.fulfilled, (state, action) => {
        state.isGeneratingQuestion = false;
        const { question, time, index } = action.payload;
        if (state.interviewQuestions.length !== index) return; // duplicate/stale response
        state.interviewQuestions.push(question);
        let questionText = question.questionText;
        if (question.questionType === 'conceptual') {
          questionText += "\n\n*(Please answer this question using your microphone.)*";
        }
        state.messages.push({ text: questionText, sender: 'bot' });
        state.timer = time;
      })
      .addCase(fetchQuestion.rejected, (state, action) => {
        state.isGeneratingQuestion = false;
        state.error = action.payload; // Set the error
        state.messages.push({ text: `Sorry, an error occurred: ${action.payload}. Please refresh to try again.`, sender: 'bot' });
      })
      .addCase(evaluateInterview.pending, (state) => {
        state.status = 'evaluating';
        state.error = null;
      })
      .addCase(evaluateInterview.fulfilled, (state, action) => {
        const { score, summary } = action.payload;
        state.finalScore = score;
        state.finalSummary = summary;
        state.status = 'completed';
        state.messages.push({ text: `**Final Score: ${score}/100**`, sender: 'bot' });
        state.messages.push({ text: summary, sender: 'bot' });
      })
      .addCase(evaluateInterview.rejected, (state, action) => {
        state.error = action.payload; // Set the error
        state.messages.push({ text: `Sorry, an error occurred during evaluation: ${action.payload}.`, sender: 'bot' });
        state.status = 'in_progress'; // Revert status
      });
  },
});

export const {
  setCandidateDetails,
  addMessage,
  submitDetail,
  startInterview,
  submitAnswer,
  decrementTimer,
  resetInterview,
} = interviewSlice.actions;

export default interviewSlice.reducer;