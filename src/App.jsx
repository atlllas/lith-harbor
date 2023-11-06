import React from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import Tenome from './components/Tenome';

function HomePage() {
  const navigate = useNavigate();

  const redirectToTenome = () => {
    navigate('/write');
  };

  return (
    <div id="home">
      <div id="buttons-container">
        <button id="tenome-button" onClick={redirectToTenome}>Tenome Editor</button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/write" element={<Tenome />} />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
