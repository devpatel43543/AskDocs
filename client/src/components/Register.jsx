// import React, { useState } from 'react';
// import { signUp } from '@aws-amplify/auth';
// import { useNavigate } from 'react-router-dom';

// const Register = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(''); // Clear previous errors
//     try {
//         console.log("0");
//       await signUp({
//         username: email,
//         password,
//         options: {
//           userAttributes: {
//             email: email, // Required attribute for Cognito
//           },
//           // Add other attributes (e.g., name) if needed
//         },
//       });
//       console.log('Registration successful');
//       navigate(`/verify?email=${encodeURIComponent(email)}`);
//     } catch (err) {
//       setError(err.message || 'An error occurred during registration');
//     }
//   };

//   return (
//     <div className="container">
//       <h2>Register</h2>
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
//         <button type="submit">Register</button>
//         {error && <p className="error">{error}</p>}
//       </form>
//       <p>Already have an account? <a href="/login">Login</a></p>
//     </div>
//   );
// };

// export default Register;

import { useState } from "react"
import { signUp } from "@aws-amplify/auth"
import { useNavigate } from "react-router-dom"
import { BookOpen, Mail, Lock } from "../compo/icons"
import "./styles.css"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("") // Clear previous errors
    try {
      console.log("0")
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email: email, // Required attribute for Cognito
          },
          // Add other attributes (e.g., name) if needed
        },
      })
      console.log("Registration successful")
      navigate(`/verify?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError(err.message || "An error occurred during registration")
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
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join StudyBuddy and start learning with AI assistance</p>
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
                placeholder="Create a strong password"
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
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-link-text">
            Already have an account?{" "}
            <a href="/login" className="auth-link">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
