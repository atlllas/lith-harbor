import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';  // Import the useNavigate hook
import './Login.css'

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const auth = getAuth(); // Get the auth instance
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password); // Use the new function
      // User is now logged in
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleSignUpRedirect = () => {
    navigate('/signup'); // Navigate to the sign-up route
  };

  return (
    <div className="container">
      <h2>LOGIN</h2>
      <form onSubmit={handleSubmit}>
      <input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button id="submit" type="submit">Login</button>
      </form>
      {error && <p>{error}</p>}
      <button id="redirect-button" onClick={handleSignUpRedirect}>Sign Up</button> {/* Add this button */}
    </div>
  );
}

export default Login;
