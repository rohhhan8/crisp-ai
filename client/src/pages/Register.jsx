import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../services/aiService';
import { Form, Input, Button, Card, message, Select } from 'antd';
import './Register.css';

const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRole = location.state?.role;

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await apiClient.post('/users/register', values);
      message.success('Registration successful! Please login.');
      navigate('/login', { state: { role: selectedRole } });
    } catch (error) {
      message.error('Registration failed. Please try again.');
      console.error('Registration failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-form">
        <h2>Register as {selectedRole || 'User'}</h2>
        <Form
          name="register"
          onFinish={onFinish}
          initialValues={{ role: selectedRole }}
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Please input your Name!' }]}
          >
            <Input placeholder="Name" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please input your Email!' }]}
          >
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="role"
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <Select placeholder="Select a role" disabled={!!selectedRole}>
              <Option value="CANDIDATE">Candidate</Option>
              <Option value="ADMIN">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              Register
            </Button>
          </Form.Item>
        </Form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>Already have an account? <Link to={{ pathname: '/login', state: { role: selectedRole } }}>Login now!</Link></p>
      </div>
    </div>
  );
};

export default Register;
