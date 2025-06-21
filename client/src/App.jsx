import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Verify from './components/Verify';
import Chat from './components/Chat';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Welcome to Study Assistant</div>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;