import React, { useState, useRef } from 'react'
import './Registration.css'

function Registration({ onBack }) {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    userID: '',
  })

  const [faceImage, setFaceImage] = useState(null)
  const [facePreview, setFacePreview] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  // ── Handle text inputs ──────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  // ── Image upload ────────────────────────────────────
  const handleImageFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, faceImage: 'Please upload a valid image file.' }))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setFacePreview(e.target.result)
      setFaceImage(file)
      setErrors(prev => ({ ...prev, faceImage: '' }))
    }
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e) => handleImageFile(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleImageFile(e.dataTransfer.files[0])
  }

  // ── Camera ──────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      setCameraActive(true)
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 100)
    } catch {
      setErrors(prev => ({ ...prev, faceImage: 'Camera access denied. Please upload an image instead.' }))
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      const file = new File([blob], 'face_capture.jpg', { type: 'image/jpeg' })
      setFaceImage(file)
      setFacePreview(canvas.toDataURL('image/jpeg'))
      setErrors(prev => ({ ...prev, faceImage: '' }))
      stopCamera()
    }, 'image/jpeg', 0.92)
  }

  const clearImage = () => {
    setFaceImage(null)
    setFacePreview(null)
    stopCamera()
  }

  // ── Validation ──────────────────────────────────────
  const validate = () => {
    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.'
    if (!formData.userID.trim()) newErrors.userID = 'User ID is required.'
    else if (!/^[A-Za-z0-9_-]{4,20}$/.test(formData.userID.trim()))
      newErrors.userID = 'User ID: 4–20 chars, letters/numbers/_ only.'
    if (!faceImage) newErrors.faceImage = 'Please provide a face image.'
    return newErrors
  }

  // ── Submit ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Build FormData — required for file upload
    const data = new FormData()
    data.append('user_id',     formData.userID)
    data.append('first_name',  formData.firstName)
    data.append('middle_name', formData.middleName)
    data.append('last_name',   formData.lastName)
    data.append('face_image',  faceImage)

    try {
      setLoading(true)
      const res = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        body: data,  // DO NOT set Content-Type — browser sets it automatically
      })

      const result = await res.json()

      if (!res.ok) {
        setErrors({ general: result.detail })
        return
      }

      setSubmitted(true)

    } catch (err) {
      setErrors({ general: 'Server unreachable. Make sure backend is running.' })
    } finally {
      setLoading(false)
    }
  }

  // ── Success Screen ──────────────────────────────────
  if (submitted) {
    return (
      <div className="reg-page">
        <div className="reg-success">
          <div className="success-icon">✓</div>
          <h2>Registration Successful!</h2>
          <p>
            Welcome, <strong>{formData.firstName} {formData.lastName}</strong>
            <br />User ID: <span className="uid-badge">{formData.userID}</span>
          </p>
          <button className="btn-primary" onClick={onBack}>Go to Home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="reg-page">
      <div className="reg-card">

        {/* Header */}
        <div className="reg-header">
          <button className="btn-back-icon" onClick={onBack} title="Back">←</button>
          <div>
            <h1 className="reg-title">Create Account</h1>
            <p className="reg-subtitle">Register for Facial Attendance System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Name Section ── */}
          <div className="section-label">Full Name</div>
          <div className="name-grid">
            <div className="field-group">
              <label>First Name <span className="req">*</span></label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="e.g. Yahya"
                className={errors.firstName ? 'input-error' : ''}
              />
              {errors.firstName && <span className="error-msg">{errors.firstName}</span>}
            </div>

            <div className="field-group">
              <label>Middle Name <span className="optional">(optional)</span></label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                placeholder="e.g. Ahmed"
              />
            </div>

            <div className="field-group">
              <label>Last Name <span className="req">*</span></label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="e.g. Khan"
                className={errors.lastName ? 'input-error' : ''}
              />
              {errors.lastName && <span className="error-msg">{errors.lastName}</span>}
            </div>
          </div>

          {/* ── User ID ── */}
          <div className="section-label">Identity</div>
          <div className="field-group uid-field">
            <label>
              User ID <span className="req">*</span>
              <span className="uid-hint">— must be unique, used for recognition</span>
            </label>
            <div className="uid-input-wrap">
              <span className="uid-prefix">#</span>
              <input
                type="text"
                name="userID"
                value={formData.userID}
                onChange={handleChange}
                placeholder="e.g. yahya_001"
                className={errors.userID ? 'input-error' : ''}
                maxLength={20}
              />
            </div>
            <div className="uid-meta">
              <span className={errors.userID ? 'error-msg' : 'field-hint'}>
                {errors.userID || '4–20 characters. Letters, numbers, underscores allowed.'}
              </span>
              <span className="char-count">{formData.userID.length}/20</span>
            </div>
          </div>

          {/* ── Face Image ── */}
          <div className="section-label">
            Face Image <span className="req">*</span>
            <span className="uid-hint"> — used for facial recognition</span>
          </div>

          {!facePreview && !cameraActive && (
            <div
              className={`face-upload-zone ${dragOver ? 'drag-active' : ''} ${errors.faceImage ? 'zone-error' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current.click()}
            >
              <div className="upload-icon">🖼</div>
              <p className="upload-main">Drag & drop or click to upload</p>
              <p className="upload-sub">JPG, PNG, WEBP — clear frontal face photo</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {!facePreview && !cameraActive && (
            <div className="face-or-row">
              <div className="or-line" /><span>or</span><div className="or-line" />
            </div>
          )}

          {!facePreview && !cameraActive && (
            <button type="button" className="btn-camera" onClick={startCamera}>
              📷 &nbsp;Use Camera
            </button>
          )}

          {cameraActive && (
            <div className="camera-wrap">
              <video ref={videoRef} autoPlay playsInline className="camera-feed" />
              <div className="camera-actions">
                <button type="button" className="btn-capture" onClick={capturePhoto}>📸 Capture</button>
                <button type="button" className="btn-cancel-cam" onClick={stopCamera}>✕ Cancel</button>
              </div>
            </div>
          )}

          {facePreview && (
            <div className="preview-wrap">
              <img src={facePreview} alt="Face preview" className="face-preview" />
              <div className="preview-overlay">
                <span className="preview-ok">✓ Face image captured</span>
                <button type="button" className="btn-retake" onClick={clearImage}>Retake</button>
              </div>
            </div>
          )}

          {errors.faceImage && <span className="error-msg face-error">{errors.faceImage}</span>}

          {/* ── General Error ── */}
          {errors.general && <p className="error-msg face-error">{errors.general}</p>}

          {/* ── Submit ── */}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register →'}
          </button>

        </form>
      </div>
    </div>
  )
}

export default Registration
