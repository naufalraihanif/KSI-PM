// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { login } from '../services/strapi';

const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  backgroundColor: '#f0f2f5',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  padding: '40px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  width: '350px'
};

const inputStyle = {
  padding: '12px',
  fontSize: '1rem',
  border: '1px solid #ccc',
  borderRadius: '4px'
};

const buttonStyle = {
  padding: '12px',
  cursor: 'pointer',
  backgroundColor: '#007cbf',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '1rem',
  fontWeight: 'bold'
};

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Baris ini bisa Anda aktifkan kembali untuk debugging jika perlu
      // console.log("Data yang akan dikirim:", { identifier: email, password: password });

      const { jwt } = await login(email, password);
      onLoginSuccess(jwt);
    } catch (err) {
      setError('Email atau kata sandi salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2>Admin Login</h2>
        <input
          style={inputStyle}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={inputStyle}
          type="password"
          placeholder="Kata Sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          // Menambahkan ini membantu mencegah masalah auto-fill dari browser
          autoComplete="new-password"
        />
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default LoginPage;