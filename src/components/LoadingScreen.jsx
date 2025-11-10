import React from 'react';

const loadingScreenStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  width: '100vw',
  backgroundColor: '#222',
  color: 'white',
  fontSize: '1.5rem',
  fontFamily: 'sans-serif',
};

function LoadingScreen() {
  return (
    <div style={loadingScreenStyle}>
      <p>Memuat Data Peta...</p>
    </div>
  );
}

export default LoadingScreen;
