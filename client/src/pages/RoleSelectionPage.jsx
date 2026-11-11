import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, DashboardOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import './RoleSelectionPage.css';

const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(true);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleModalOk = () => {
    setIsModalVisible(false);
  };

  const renderActionButtons = () => {
    if (!selectedRole) return null;

    return (
      <div className="action-buttons-container">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => setSelectedRole(null)} 
          className="back-button"
        >
          Back
        </Button>
        <div className="role-specific-buttons">
          <Button type="primary" size="large" onClick={() => handleNavigate('/login', { state: { role: selectedRole } })}>
            Login
          </Button>
          {selectedRole === 'candidate' && (
            <Button type="default" size="large" onClick={() => handleNavigate('/register')}>
              Sign Up
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="role-selection-background">
       <Modal
        title="Welcome to the AI Interview Assistant!"
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalOk}
        footer={[
          <Button key="submit" type="primary" onClick={handleModalOk}>
            Got it!
          </Button>,
        ]}
        centered
      >
        <p>This application is designed to help you practice for technical interviews.</p>
        <p><strong>Candidates:</strong> You can upload your resume and participate in an automated screening interview with an AI assistant.</p>
        <p><strong>Interviewers:</strong> You can view the results and analytics of the candidates who have completed the interviews.</p>
        <p>Please select your role to begin.</p>
      </Modal>

      <div className="role-selection-container">
        {!selectedRole ? (
          <>
            <h1 className="main-title">Welcome to the AI Interview Assistant</h1>
            <p className="main-subtitle">Please select your role to continue</p>
            <div className="role-cards-wrapper">
              {/* Candidate Card */}
              <div className="role-card" onClick={() => setSelectedRole('candidate')}>
                <div className="card-icon-wrapper">
                  <UserOutlined className="card-icon" />
                </div>
                <h2 className="card-title">Candidate</h2>
                <p className="card-description">Start your automated screening interview.</p>
              </div>

              {/* Interviewer Card */}
              <div className="role-card" onClick={() => setSelectedRole('interviewer')}>
                <div className="card-icon-wrapper">
                  <DashboardOutlined className="card-icon" />
                </div>
                <h2 className="card-title">Interviewer</h2>
                <p className="card-description">View candidate results and analytics.</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="main-title">{selectedRole === 'candidate' ? 'Candidate' : 'Interviewer'}</h1>
            <p className="main-subtitle">Please login or sign up to continue.</p>
            {renderActionButtons()}
          </>
        )}
      </div>
    </div>
  );
};

export default RoleSelectionPage;
