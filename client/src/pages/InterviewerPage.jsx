import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Table, Modal, Input, Skeleton, Tag } from 'antd';
import './InterviewerPage.css';

const { Search } = Input;

// Helper component to display vocal analysis
const VocalAnalysis = ({ analysis }) => {
  if (!analysis) return null;

  const sentimentColor = {
    POSITIVE: 'green',
    NEGATIVE: 'red',
    NEUTRAL: 'blue',
  }[analysis.sentiment] || 'default';

  return (
    <div className="vocal-analysis-container">
      <h4>Vocal Analysis:</h4>
      <p><strong>Sentiment:</strong> <Tag color={sentimentColor}>{analysis.sentiment}</Tag></p>
      <p><strong>Confidence:</strong> {`${(analysis.confidence * 100).toFixed(1)}%`}</p>
      {analysis.filler_word_count > 0 && (
        <p><strong>Filler Words:</strong> {`${analysis.filler_word_count} (${analysis.filler_words.join(', ')})`}</p>
      )}
    </div>
  );
};

const InterviewerPage = () => {
  const allCandidates = useSelector((state) => state.candidates.allCandidates);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleRowClick = (record) => {
    setSelectedCandidate(record);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedCandidate(null);
  };

  const handleSearch = (value) => {
    setSearchText(value.toLowerCase());
  };

  const filteredCandidates = allCandidates.filter(candidate =>
    candidate.details.name.toLowerCase().includes(searchText)
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: ['details', 'name'],
      key: 'name',
      sorter: (a, b) => a.details.name.localeCompare(b.details.name),
    },
    {
      title: 'Email',
      dataIndex: ['details', 'email'],
      key: 'email',
    },
    {
      title: 'Final Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => a.score - b.score,
      render: (score) => `${score}%`
    },
    {
      title: 'AI Summary',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
    },
  ];

  return (
    <div className="interviewer-page">
      <h1 className="dashboard-title">Interviewer Dashboard</h1>
      <Search
        placeholder="Search by candidate name"
        onSearch={handleSearch}
        onChange={(e) => handleSearch(e.target.value)}
        style={{ width: 300, marginBottom: 20 }}
      />
      {loading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredCandidates}
          rowKey={(record) => record.details.email} // Assuming email is unique
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
          })}
          rowClassName="candidate-row"
        />
      )}
      {selectedCandidate && (
        <Modal
          title={`Interview Details: ${selectedCandidate.details.name}`}
          visible={isModalVisible}
          onOk={handleModalClose}
          onCancel={handleModalClose}
          width={800}
          footer={null}
        >
          <div className="modal-content">
            <h3><strong>Personal Details:</strong></h3>
            <p><strong>Name:</strong> {selectedCandidate.details.name}</p>
            <p><strong>Email:</strong> {selectedCandidate.details.email}</p>
            <p><strong>Final Score:</strong> {selectedCandidate.score}%</p>
            <hr />
            <h3><strong>AI-Generated Summary:</strong></h3>
            <p>{selectedCandidate.summary}</p>
            <hr />
            <h3><strong>Q&A:</strong></h3>
            <div className="qa-list">
              {selectedCandidate.questions.map((q, index) => {
                const answer = selectedCandidate.answers[index];
                return (
                  <div key={index} className="qa-item">
                    <p><strong>Question {index + 1}:</strong> {q}</p>
                    <p><strong>Answer:</strong> {answer?.text || 'No answer provided'}</p>
                    <VocalAnalysis analysis={answer?.analysis} />
                  </div>
                )
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InterviewerPage;