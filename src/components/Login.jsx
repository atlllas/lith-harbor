import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';  // Import the useNavigate hook

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
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit">Login</button>
      </form>
      {error && <p>{error}</p>}
      <button onClick={handleSignUpRedirect}>Sign Up</button> {/* Add this button */}
    </div>
  );
}

export default Login;
