import React from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Import useSelector
import { setCandidateDetails } from '../features/interviewSlice';
import ResumeUpload from '../components/ResumeUpload';
import ChatInterface from '../components/ChatInterface';

const IntervieweePage = () => {
  const dispatch = useDispatch();
  // Get resumeUploaded status from the Redux store
  const resumeUploaded = useSelector((state) => state.interview.resumeUploaded);

  const handleResumeUpload = (data) => {
    console.log('Resume Data:', data);
    dispatch(setCandidateDetails(data));
    // No longer need to set local state
  };

  return (
    <div>
      {!resumeUploaded ? (
        <ResumeUpload onUploadSuccess={handleResumeUpload} />
      ) : (
        <ChatInterface />
      )}
    </div>
  );
};

export default IntervieweePage;