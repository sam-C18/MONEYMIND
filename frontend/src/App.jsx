import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import FaceVerification from './components/FaceVerification'
import Home from './components/Home'
import './App.css'

function App() {
  const [accountNumber, setAccountNumber] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)

  const handleStartVerification = () => {
    if (!accountNumber) {
      alert('Please enter your account number')
      return
    }
    setIsVerifying(true)
    setVerificationComplete(false)
    setVerificationResult(null)
  }

  const handleVerificationComplete = (result) => {
    setVerificationResult(result)
    setVerificationComplete(true)
    setIsVerifying(false)
  }

  return (
    <Router>
      <div className="app">
        <nav className="nav-bar">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/verify" className="nav-link">Face Verification</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/verify" element={
            <>
              <h1>Face Verification System</h1>
              
              {!isVerifying && !verificationComplete && (
                <div className="start-section">
                  <input
                    type="text"
                    placeholder="Enter your account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                  <button onClick={handleStartVerification}>
                    Start Face Verification
                  </button>
                </div>
              )}

              {isVerifying && (
                <FaceVerification
                  accountNumber={accountNumber}
                  onVerificationComplete={handleVerificationComplete}
                />
              )}

              {verificationComplete && verificationResult && (
                <div className={`verification-complete ${verificationResult.match ? 'success' : 'failure'}`}>
                  <h2>{verificationResult.match ? 'Verification Successful!' : 'Verification Failed'}</h2>
                  <p>{verificationResult.message}</p>
                  {verificationResult.match ? (
                    <p>Your face verification has been completed successfully.</p>
                  ) : (
                    <p>Please try again with better lighting and positioning.</p>
                  )}
                  <button onClick={() => {
                    setVerificationComplete(false)
                    setVerificationResult(null)
                    setAccountNumber('')
                  }}>
                    Start New Verification
                  </button>
                </div>
              )}
            </>
          } />
        </Routes>

        <style jsx>{`
          .app {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
          }

          .nav-bar {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
          }

          .nav-link {
            text-decoration: none;
            color: #007bff;
            font-size: 18px;
            padding: 8px 16px;
            border-radius: 4px;
            transition: background-color 0.2s;
          }

          .nav-link:hover {
            background: #e9ecef;
          }

          .start-section {
            margin: 40px 0;
          }

          input {
            padding: 10px;
            font-size: 16px;
            margin-right: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            width: 300px;
          }

          button {
            padding: 10px 20px;
            font-size: 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }

          button:hover {
            background: #0056b3;
          }

          .verification-complete {
            margin: 40px auto;
            padding: 20px;
            max-width: 600px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .verification-complete.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
          }

          .verification-complete.failure {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
          }

          .verification-complete h2 {
            margin: 0 0 15px 0;
            font-size: 24px;
          }

          .verification-complete p {
            margin: 10px 0;
            font-size: 16px;
          }
        `}</style>
      </div>
    </Router>
  )
}

export default App
