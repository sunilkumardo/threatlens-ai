import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) { setError('Please fill all fields'); return; }
    setLoading(true); setError('');
    try {
      if (isRegister) {
        await axios.post(`${API}/auth/register`, { username, password });
        setIsRegister(false);
        setError('Registered! Please login now.');
      } else {
        const res = await axios.post(`${API}/auth/login`, { username, password });
        onLogin(res.data.token, res.data.username);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🔐</div>
        <h1 style={styles.title}>ThreatLens AI</h1>
        <p style={styles.subtitle}>AI-Powered Vulnerability Scanner</p>

        <div style={styles.form}>
          <input
            style={styles.input}
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSubmit()}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>
          <p style={styles.toggle} onClick={() => { setIsRegister(!isRegister); setError(''); }}>
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%)' },
  card: { background: '#1a1f35', border: '1px solid #2d3561', borderRadius: '16px', padding: '48px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  logo: { fontSize: '48px', marginBottom: '16px' },
  title: { fontSize: '28px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px' },
  subtitle: { color: '#64748b', marginBottom: '32px', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #2d3561', background: '#0a0e1a', color: '#e2e8f0', fontSize: '15px', outline: 'none' },
  button: { padding: '12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  error: { color: '#f87171', fontSize: '13px' },
  toggle: { color: '#3b82f6', cursor: 'pointer', fontSize: '13px' }
};