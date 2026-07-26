import React, { useState, useRef, useEffect } from 'react'
import './Login.css'

function Login({ onBack }) {
  const [phase, setPhase] = useState('intro')      // intro | scanning | verifying | success | error
  const [userData, setUserData] = useState(null)
  const [attendanceData, setAttendanceData] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [countdown, setCountdown] = useState(3)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const countdownRef = useRef(null)

  // ── Cleanup camera on unmount ───────────────────────
  useEffect(() => {
    return () => stopCamera()
  }, [])

  // ── Start Camera ────────────────────────────────────
  const startCamera = async () => {
    setPhase('scanning')
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      streamRef.current = stream
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 100)

      // Countdown 3 seconds then auto-capture
      setCountdown(3)
      let count = 3
      countdownRef.current = setInterval(() => {
        count -= 1
        setCountdown(count)
        if (count === 0) {
          clearInterval(countdownRef.current)
          captureAndVerify()
        }
      }, 1000)

    } catch (err) {
      setErrorMsg('Camera access denied. Please allow camera permissions and try again.')
      setPhase('error')
    }
  }

  // ── Stop Camera ─────────────────────────────────────
  const stopCamera = () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  // ── Capture frame & send to backend ─────────────────
  const captureAndVerify = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0)

    stopCamera()
    setPhase('verifying')

    canvas.toBlob(async (blob) => {
      try {
        // ── Step 1: verify identity ───────────────────
        const loginFormData = new FormData()
        loginFormData.append('face_image', new File([blob], 'login_face.jpg', { type: 'image/jpeg' }))

        const res = await fetch('http://localhost:8000/auth/login-face', {
          method: 'POST',
          body: loginFormData,
        })

        const result = await res.json()

        if (!res.ok) {
          setErrorMsg(result.detail || 'Face not recognized. Please try again.')
          setPhase('error')
          return
        }

        setUserData(result)

        // ── Step 2: actually mark attendance ──────────
        const attendanceFormData = new FormData()
        attendanceFormData.append('face_image', new File([blob], 'attendance_face.jpg', { type: 'image/jpeg' }))

        const attendanceRes = await fetch('http://localhost:8000/attendance/mark', {
          method: 'POST',
          body: attendanceFormData,
        })

        const attendanceResult = await attendanceRes.json()

        if (!attendanceRes.ok) {
          setErrorMsg(attendanceResult.detail || 'Login succeeded but attendance could not be marked.')
          setPhase('error')
          return
        }

        setAttendanceData(attendanceResult)
        setPhase('success')

      } catch (err) {
        setErrorMsg('Server unreachable. Make sure the backend is running.')
        setPhase('error')
      }
    }, 'image/jpeg', 0.92)
  }

  // ── Retry ───────────────────────────────────────────
  const handleRetry = () => {
    setErrorMsg('')
    setPhase('intro')
  }

  // ══════════════════════════════════════════════════════
  // ── RENDER: Intro ────────────────────────────────────
  // ══════════════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <button className="btn-back-icon" onClick={onBack}>←</button>
            <div>
              <h1 className="login-title">Face Login</h1>
              <p className="login-subtitle">Sign in using facial recognition</p>
            </div>
          </div>

          <div className="face-graphic">
            <div className="face-ring face-ring--outer" />
            <div className="face-ring face-ring--inner" />
            <div className="face-icon">👤</div>
          </div>

          <div className="intro-instructions">
            <div className="instruction-item">
              <span className="instruction-dot" />
              Position your face clearly in front of the camera
            </div>
            <div className="instruction-item">
              <span className="instruction-dot" />
              Make sure the area is well lit
            </div>
            <div className="instruction-item">
              <span className="instruction-dot" />
              Remove glasses or anything covering your face
            </div>
            <div className="instruction-item">
              <span className="instruction-dot" />
              Photo will be taken automatically in 3 seconds
            </div>
          </div>

          <button className="btn-submit" onClick={startCamera}>
            Start Face Scan
          </button>

          <p className="login-footer">
            Not registered?{' '}
            <span className="login-link" onClick={onBack}>Go back and Register</span>
          </p>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════
  // ── RENDER: Scanning ─────────────────────────────────
  // ══════════════════════════════════════════════════════
  if (phase === 'scanning') {
    return (
      <div className="login-page">
        <div className="login-card login-card--wide">
          <div className="login-header">
            <button className="btn-back-icon" onClick={() => { stopCamera(); setPhase('intro') }}>←</button>
            <div>
              <h1 className="login-title">Scanning Face</h1>
              <p className="login-subtitle">Hold still — photo in {countdown}s</p>
            </div>
          </div>

          <div className="camera-container">
            <video ref={videoRef} autoPlay playsInline className="camera-feed" />

            {/* Scanning overlay */}
            <div className="scan-overlay">
              <div className="scan-frame">
                <div className="scan-corner scan-corner--tl" />
                <div className="scan-corner scan-corner--tr" />
                <div className="scan-corner scan-corner--bl" />
                <div className="scan-corner scan-corner--br" />
                <div className="scan-line" />
              </div>
            </div>

            {/* Countdown bubble */}
            <div className="countdown-bubble">
              {countdown}
            </div>
          </div>

          <button
            className="btn-cancel"
            onClick={() => { stopCamera(); setPhase('intro') }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════
  // ── RENDER: Verifying ────────────────────────────────
  // ══════════════════════════════════════════════════════
  if (phase === 'verifying') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="verifying-wrap">
            <div className="spinner" />
            <h2 className="verifying-title">Verifying Face...</h2>
            <p className="verifying-sub">Comparing against registered users</p>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════
  // ── RENDER: Success ──────────────────────────────────
  // ══════════════════════════════════════════════════════
  if (phase === 'success' && userData) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="success-wrap">
            <div className="success-icon">✓</div>
            <h2>Face Recognized!</h2>
            <p className="success-name">
              {userData.first_name} {userData.middle_name ? userData.middle_name + ' ' : ''}{userData.last_name}
            </p>
            <span className="uid-badge">#{userData.user_id}</span>
            {attendanceData && (
              <p className="success-time">
                Attendance {attendanceData.status} at{' '}
                {new Date(attendanceData.timestamp + 'Z').toLocaleTimeString()}
              </p>
            )}
            <button className="btn-submit" onClick={onBack}>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════
  // ── RENDER: Error ────────────────────────────────────
  // ══════════════════════════════════════════════════════
  if (phase === 'error') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="error-wrap">
            <div className="error-icon">✕</div>
            <h2>Recognition Failed</h2>
            <p className="error-detail">{errorMsg}</p>
            <div className="error-actions">
              <button className="btn-submit" onClick={handleRetry}>
                Try Again
              </button>
              <button className="btn-cancel" onClick={onBack}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default Login
