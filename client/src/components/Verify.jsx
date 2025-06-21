// import React, { useState } from 'react';
// import { confirmSignUp, signOut } from '@aws-amplify/auth';
// import { useSearchParams, useNavigate } from 'react-router-dom';

// const Verify = () => {
//   const [code, setCode] = useState('');
//   const [error, setError] = useState('');
//   const [searchParams] = useSearchParams();
//   const email = searchParams.get('email');
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(''); // Clear previous errors
//     try {
//       await confirmSignUp({
//         username: email,
//         confirmationCode: code,
//       });
//       await signOut();
//       console.log('Email verification successful');
//       navigate('/login'); // Redirect to login page after verification
//     } catch (err) {
//       setError(err.message || 'An error occurred during verification');
//     }
//   };

//   return (
//     <div className="container">
//       <h2>Verify Your Email</h2>
//       <p>Please enter the verification code sent to {email}</p>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           value={code}
//           onChange={(e) => setCode(e.target.value)}
//           placeholder="Verification Code"
//           required
//         />
//         <button type="submit">Verify</button>
//         {error && <p className="error">{error}</p>}
//       </form>
//     </div>
//   );
// };

// export default Verify;

import { useState } from "react"
import { confirmSignUp, signOut } from "@aws-amplify/auth"
import { useSearchParams, useNavigate } from "react-router-dom"
import { BookOpen, Shield, Mail } from "../compo/icons"
import "./styles.css"

export default function Verify() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("") // Clear previous errors
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      })
      await signOut()
      console.log("Email verification successful")
      navigate("/login") // Redirect to login page after verification
    } catch (err) {
      setError(err.message || "An error occurred during verification")
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
          <div className="verify-icon-container">
            <Mail className="verify-icon" />
          </div>
          <h2 className="auth-title">Verify Your Email</h2>
          <p className="auth-subtitle">
            We've sent a verification code to <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="code" className="form-label">
              Verification Code
            </label>
            <div className="input-wrapper">
              <Shield className="input-icon" />
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="form-input verification-input"
                required
                maxLength="6"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <button type="submit" className="auth-button">
            Verify Email
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-link-text">
            Didn't receive the code?{" "}
            <a href="/register" className="auth-link">
              Try again
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
