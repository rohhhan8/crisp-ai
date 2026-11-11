import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import IntervieweePage from './pages/IntervieweePage';
import InterviewerPage from './pages/InterviewerPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import Register from './pages/Register';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<RoleSelectionPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/interviewee" element={<ProtectedRoute><IntervieweePage /></ProtectedRoute>} />
            <Route path="/interviewer" element={<ProtectedRoute><InterviewerPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
