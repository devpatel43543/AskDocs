// import React, { useState } from 'react';
// import { signIn } from '@aws-amplify/auth';
// import { useNavigate } from 'react-router-dom';

// const Login = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(''); // Clear previous errors
//     try {
//       await signIn({ username: email, password });
//       console.log('Login successful');
//       navigate('/chat'); // Redirect to chat page (to be created later)
//     } catch (err) {
//         console.log(error);
//       setError(err.message || 'An error occurred during login');
//     }
//   };

//   return (
//     <div className="container">
//       <h2>Login</h2>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Email"
//           required
//         />
//         <input
//           type="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           placeholder="Password"
//           required
//         />
//         <button type="submit">Login</button>
//         {error && <p className="error">{error}</p>}
//       </form>
//     </div>
//   );
// };

// export default Login;

import { useState } from "react"
import { signIn } from "@aws-amplify/auth"
import { useNavigate } from "react-router-dom"
import { BookOpen, Mail, Lock } from "../compo/icons"
import "./styles.css"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("") // Clear previous errors
    try {
      await signIn({ username: email, password })
      console.log("Login successful")
      navigate("/chat") // Redirect to chat page
    } catch (err) {
      console.log(error)
      setError(err.message || "An error occurred during login")
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <BookOpen className="auth-brand-icon" />
            <h1 className="auth-brand-title">StudyBuddy</h1>
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to continue your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-input"
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <button type="submit" className="auth-button">
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-link-text">
            Don't have an account?{" "}
            <a href="/register" className="auth-link">
              Create one here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
