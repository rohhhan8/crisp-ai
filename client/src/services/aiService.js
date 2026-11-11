
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  const response = await apiClient.post('/upload-resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const generateQuestion = async (difficulty, time) => {
  // The backend expects an object with a 'difficulty' and 'time_limit' key
  const response = await apiClient.post('/generate-question', { difficulty, time_limit: time });
  // We return response.data directly, which is the { questionText, questionType } object
  return response.data;
};

export const getInterviewFeedback = async (transcript) => {
  const response = await apiClient.post('/evaluate-interview', { transcript });
  return response.data;
};

export const analyzeAudio = async (audioFile) => {
  const formData = new FormData();
  formData.append('audio', audioFile);
  const response = await apiClient.post('/analyze-audio', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
