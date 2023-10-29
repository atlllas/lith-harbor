import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';  // Import the useNavigate hook
import './Login.css'

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const auth = getAuth();
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // User account created & the user is signed in
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignUpRedirect = () => {
    navigate('/login'); // Navigate to the sign-up route
  };


  return (
    <div className="container">
      <h2>SIGN UP</h2>
      <form onSubmit={handleSignUp}>
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
        <button id="submit" type="submit">Sign Up</button>
      </form>
      {error && <p>{error}</p>}
      <button id="redirect-button" onClick={handleSignUpRedirect}>Login</button> {/* Add this button */}
    </div>
  );
}

export default SignUp;
