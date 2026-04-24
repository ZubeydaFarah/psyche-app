import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Biotypes from './pages/Biotypes';
import Models from './pages/Models';
import Compare from './pages/Compare';
import Upload from './pages/Upload';
import './App.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'psyche2026') {
      onLogin();
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>PSYCHE</h1>
          <div className="divider" />
          <p>NEUROIMAGING INTELLIGENCE PLATFORM</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoComplete="off" />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn">ACCESS PLATFORM</button>
        </form>
      </div>
    </div>
  );
}

function Layout({ onLogout }) {
  return (
    <>
      <nav className="nav">
        <div className="nav-logo">PSYCHE</div>
        <div className="nav-links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/subjects">Profiler</NavLink>
          <NavLink to="/biotypes">Explorer</NavLink>
          <NavLink to="/compare">Compare</NavLink>
          <NavLink to="/upload">Upload</NavLink>
          <NavLink to="/models">Models</NavLink>
        </div>
        <div className="nav-user">
          <span>Ms. Z. Farah</span>
          <button className="logout-btn" onClick={onLogout}>Sign out</button>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/biotypes" element={<Biotypes />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/models" element={<Models />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  return (
    <Router>
      {!loggedIn ? <Login onLogin={() => setLoggedIn(true)} /> : <Layout onLogout={() => setLoggedIn(false)} />}
    </Router>
  );
}

export default App;
