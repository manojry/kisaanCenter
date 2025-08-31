import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => (
  <div className="loading-spinner-container">
    <div className="loading-spinner" />
    {message && <div className="loading-message">{message}</div>}
  </div>
);

export default LoadingSpinner;
