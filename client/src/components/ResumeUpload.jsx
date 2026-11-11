import React, { useState, useRef } from 'react';
import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { uploadResume } from '../services/aiService'; // Correctly import the service
import './ResumeUpload.css';

const { Dragger } = Upload;

const ResumeUpload = ({ onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);

  // Prevent duplicate triggers (Strict Mode safe)
  const uploadTriggered = useRef(false);

  const customRequest = async ({ file, onSuccess, onError }) => {
    if (uploadTriggered.current) {
      console.log("Duplicate upload prevented.");
      return;
    }
    uploadTriggered.current = true; // Lock trigger

    setLoading(true);

    try {
      // Use the centralized API service instead of a hardcoded URL
      const responseData = await uploadResume(file);

      if (responseData) { // Assuming the service returns data on success
        message.success(`${file.name} uploaded and parsed successfully.`);
        onUploadSuccess(responseData.data);
        onSuccess();
      } else {
        message.error(`Failed to get a valid response for ${file.name}.`);
        onError(new Error('Upload failed: No response data'));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred during the upload.';
      message.error(errorMessage);
      onError(error);
    } finally {
      setLoading(false);
      // Resetting the flag to allow another upload attempt if needed
      uploadTriggered.current = false;
    }
  };

  return (
    <div className="resume-upload-container">
      <h1 className="upload-title">AI Interview Assistant</h1>
      <p className="upload-subtitle">
        Upload your resume to get started. The AI will parse your details and then begin the interview.
      </p>
      <div className="dragger-container">
        <Dragger
          customRequest={customRequest}
          disabled={loading}
          showUploadList={false}
          multiple={false}
          accept=".pdf"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single PDF file. Your resume will be parsed to extract your name, email, and phone number.
          </p>
        </Dragger>
      </div>
    </div>
  );
};

export default ResumeUpload;
