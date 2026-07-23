import React, { useState, useEffect } from 'react'
import HomeImage from './img_resource/img_home.jpg'
import Registration from './Registration'
import Login from './Login'
import './Home.css'

function Home() {
  const [page, setPage] = useState('home')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Lock scroll on home, allow scroll on other pages
  useEffect(() => {
    document.body.style.overflow = page === 'home' ? 'hidden' : 'auto'
    return () => { document.body.style.overflow = 'auto' }
  }, [page])

  if (page === 'login') {
    return <Login onBack={() => setPage('home')} />
  }

  if (page === 'register') {
    return <Registration onBack={() => setPage('home')} />
  }

  return (
    <div
      className="home-container"
      style={{ backgroundImage: `url(${HomeImage})` }}
    >
      <div className="home-overlay" />

      <div className={`home-content ${visible ? 'home-content--visible' : ''}`}>
        <div className="home-tag">AI-Powered Biometric System</div>

        <h1 className="home-title">
          Facial Attendance<br />
          <span className="home-title-accent">System</span>
        </h1>

        <p className="home-subtitle">
          Smart, Secure, and Efficient Attendance Management
        </p>

        <div className="home-buttons">
          <button className="btn-primary" onClick={() => setPage('login')}>
            Login
          </button>
          <button className="btn-secondary" onClick={() => setPage('register')}>
            Register
          </button>
        </div>

        <div className="home-stats">
          <div className="stat">
            <span className="stat-value">99.8%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">&lt; 1s</span>
            <span className="stat-label">Recognition</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">24/7</span>
            <span className="stat-label">Uptime</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
