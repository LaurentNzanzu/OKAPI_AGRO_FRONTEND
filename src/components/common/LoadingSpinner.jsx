// frontend/src/components/common/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ fullScreen = false, size = 'medium', message = 'Chargement...' }) => {
  
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: '30px', height: '30px', borderWidth: '3px' };
      case 'large':
        return { width: '60px', height: '60px', borderWidth: '5px' };
      default:
        return { width: '45px', height: '45px', borderWidth: '4px' };
    }
  };

  const spinnerStyle = getSize();

  return (
    <div className={`loading-spinner-container ${fullScreen ? 'fullscreen' : ''}`}>
      <style>{`
        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }
        .loading-spinner-container.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          z-index: 9999;
          padding: 0;
        }
        .spinner {
          border-radius: 50%;
          border-style: solid;
          border-color: #e0e0e0;
          border-top-color: #667eea;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-message {
          margin-top: 16px;
          color: #666;
          font-size: 14px;
        }
      `}</style>
      
      <div 
        className="spinner" 
        style={spinnerStyle}
      />
      {message && <div className="loading-message">{message}</div>}
    </div>
  );
};

export default LoadingSpinner;