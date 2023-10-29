import React, { useRef, useEffect, useState } from 'react'
import { useNavigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

import Tenome from './components/Tenome'

const firebaseConfig = {
  apiKey: "AIzaSyDXEoaAnQ0nrdj5JIyfv1GMbgqz_3gXgMw",
  authDomain: "lith-harbor.firebaseapp.com",
  projectId: "lith-harbor",
  storageBucket: "lith-harbor.appspot.com",
  messagingSenderId: "583917238556",
  appId: "1:583917238556:web:9c38d3f4afe99bbd0de2d9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const handleLogout = async () => {
  const auth = getAuth();
  try {
    await signOut(auth);
    console.log("Logged out successfully!");
    // Here, you can also add any state changes or navigation if required
  } catch (error) {
    console.error("Error logging out: ", error);
  }
};

function HomePage() {
  const navigate = useNavigate();

  const redirectToTenome = () => {
    navigate('/write');
  };

  return (
    <div id="home">
      <div id="buttons-container">
        <button id="tenome-button" onClick={redirectToTenome}>Tenome Editor</button>
        <button id="yijing-button" onClick={console.log('hi')}>Yijing</button>
      </div>
      <button id="logout-button" className="action-button" onClick={handleLogout}>Logout</button>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <HomePage /> : <Login />} />
        <Route path="/signup" element={isAuthenticated ? <HomePage /> : <SignUp />} />
        <Route path="/write" element={isAuthenticated ? <Tenome /> : <Login />} />
        <Route path="/" element={isAuthenticated ? <HomePage /> : <Login />} />
      </Routes>
    </Router>
  );
}

export default App;