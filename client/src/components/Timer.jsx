import React from 'react';

const Timer = ({ seconds }) => {
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div style={{ fontSize: '2em', fontWeight: 'bold', margin: '10px 0', color: seconds < 10 ? 'red' : 'inherit' }}>
      {formatTime(seconds)}
    </div>
  );
};

export default Timer;