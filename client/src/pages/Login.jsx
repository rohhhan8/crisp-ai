import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { apiClient } from '../services/aiService';
import { login } from '../services/auth';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/users/login', values);
      const { token, role } = response.data;
      login(token); // Store the token

      const lowerCaseRole = role.toLowerCase();

      // Redirect based on role
      if (lowerCaseRole === 'interviewee' || lowerCaseRole === 'candidate') {
        navigate('/interviewee');
      } else if (lowerCaseRole === 'interviewer' || lowerCaseRole === 'admin') {
        navigate('/interviewer');
      } else {
        // Fallback or error if role is unexpected
        setError('Invalid user role received.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          requiredMark="optional"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>

          {error && <Alert message={error} type="error" showIcon />}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Log in
            </Button>
          </Form.Item>
        </Form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>Don't have an account? <Link to="/register">Sign up now!</Link></p>
      </div>
    </div>
  );
};

export default Login;