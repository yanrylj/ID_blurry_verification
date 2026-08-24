import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, Loader2, Camera, X } from 'lucide-react';
import { checkImageBlur } from './utils/blurDetection';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }
    
    setIsAnalyzing(true);
    setResult(null);
    setImage(null);
    
    try {
      const data = await checkImageBlur(file);
      setImage(data.previewUrl);
      setResult({
        isBlurry: data.isBlurry,
        score: data.score
      });
    } catch (error) {
      console.error(error);
      alert('Failed to analyze image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access the camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (isCameraActive) {
        stopCamera();
      }
    };
  }, [isCameraActive, stopCamera]);

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          stopCamera();
          processFile(file);
        }
      }, 'image/jpeg');
    }
  };

  return (
    <div className="app-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>
      
      <main className="main-content">
        <header className="header">
          <h1 className="title">ID Blur Verification</h1>
          <p className="subtitle">Upload your ID card to check if it meets our quality standards.</p>
        </header>

        <div className="verification-card">
          {!image && !isAnalyzing && !isCameraActive ? (
            <div className="input-options">
              <div 
                className={`dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
                <div className="dropzone-content">
                  <div className="icon-wrapper">
                    <UploadCloud size={48} className="upload-icon" />
                  </div>
                  <h3>Drag & Drop your ID here</h3>
                  <p>or click to browse from your device</p>
                  <div className="format-pills">
                    <span>PNG</span>
                    <span>JPG</span>
                    <span>JPEG</span>
                  </div>
                </div>
              </div>
              
              <div className="divider"><span>OR</span></div>
              
              <button className="camera-button" onClick={startCamera}>
                <Camera size={24} />
                Capture from Web Camera
              </button>
            </div>
          ) : isCameraActive ? (
            <div className="camera-container">
              <div className="video-wrapper">
                <video ref={videoRef} autoPlay playsInline className="camera-video"></video>
                <div className="focus-box">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
              </div>
              <div className="camera-controls">
                <button className="capture-btn" onClick={captureImage}>
                  <Camera size={20} /> Capture ID
                </button>
                <button className="cancel-btn" onClick={stopCamera}>
                  <X size={20} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="result-container">
              {isAnalyzing ? (
                <div className="analyzing-state">
                  <Loader2 className="spinner" size={48} />
                  <h2>Analyzing Image...</h2>
                  <p>Checking focus and clarity</p>
                </div>
              ) : (
                <div className="analysis-result">
                  <div className="image-preview-wrapper">
                    <img src={image} alt="ID Preview" className="image-preview" />
                    <div className="focus-box">
                      <div className="corner top-left"></div>
                      <div className="corner top-right"></div>
                      <div className="corner bottom-left"></div>
                      <div className="corner bottom-right"></div>
                    </div>
                  </div>
                  
                  <div className={`status-badge ${result?.isBlurry ? 'error' : 'success'}`}>
                    {result?.isBlurry ? (
                      <>
                        <AlertTriangle size={24} />
                        <div>
                          <strong>Image is Blurry</strong>
                          <span>Score: {result?.score}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={24} />
                        <div>
                          <strong>Image is Clear</strong>
                          <span>Score: {result?.score}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <button 
                    className="reset-button"
                    onClick={() => {
                      setImage(null);
                      setResult(null);
                    }}
                  >
                    Upload Another Image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
