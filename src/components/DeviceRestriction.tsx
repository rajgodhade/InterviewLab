"use client";

import React, { useEffect, useState } from "react";

export default function DeviceRestriction() {
  const [currentWidth, setCurrentWidth] = useState(0);
  const [isSmallDevice, setIsSmallDevice] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkSize = () => {
      const width = window.innerWidth;
      setCurrentWidth(width);
      setIsSmallDevice(width < 1200);
    };

    checkSize();
    window.addEventListener("resize", checkSize, { passive: true });
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    if (mounted && isSmallDevice) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isSmallDevice, mounted]);

  if (!mounted || !isSmallDevice) return null;

  const progress = Math.min((currentWidth / 1200) * 100, 100);

  return (
    <div className="device-restriction-overlay">
      <div className="background-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="restriction-content">
        <div className="header-visual">
          <div className="icon-main">
            <span className="material-icons-round">desktop_windows</span>
            <div className="pulse-ring"></div>
          </div>
          <div className="device-comparison">
            <span className="material-icons-round device-icon phone">smartphone</span>
            <div className="connector">
              <div className="connector-dot"></div>
              <div className="connector-line"></div>
              <div className="connector-dot"></div>
            </div>
            <span className="material-icons-round device-icon monitor active">desktop_windows</span>
          </div>
        </div>
        
        <div className="text-content">
          <h1 className="gradient-text">Desktop Experience Required</h1>
          <p className="description">
            InterviewLab is built for professional interview simulations. 
            To maintain the integrity of the AI evaluation and proctoring tools, 
            <strong> a larger display is required.</strong>
          </p>
          
          <div className="width-tracker">
            <div className="tracker-header">
              <span>Your Current Width</span>
              <span className="current-value">{currentWidth}px</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              <div className="target-marker" style={{ left: '100%' }}>
                <span className="marker-label">1200px</span>
              </div>
            </div>
          </div>

          <div className="restriction-info">
            <div className="info-card">
              <div className="info-icon">
                <span className="material-icons-round">laptop_mac</span>
              </div>
              <div className="info-text">
                <h3>Optimize Flow</h3>
                <p>Better multi-tasking and code editing</p>
              </div>
            </div>
            <div className="info-card highlight">
              <div className="info-icon">
                <span className="material-icons-round">auto_awesome</span>
              </div>
              <div className="info-text">
                <h3>AI Proctoring</h3>
                <p>Full-screen AI monitoring enabled</p>
              </div>
            </div>
          </div>
        </div>

        <div className="footer">
          <div className="status-badge">
            <span className="dot"></span>
            Mobile Support in Development
          </div>
        </div>
      </div>

      <style jsx>{`
        .device-restriction-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #030712;
          z-index: 9999999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start; /* Changed from center to allow scrolling from top */
          padding: 2rem 1.5rem;
          color: #f8fafc;
          font-family: 'Outfit', 'Inter', sans-serif;
          overflow-y: auto; /* Allow vertical scrolling */
          -webkit-overflow-scrolling: touch;
        }

        .background-blobs {
          position: fixed; /* Keep blobs fixed in background */
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          filter: blur(80px);
          opacity: 0.4;
          z-index: -1;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          background: #3b82f6;
          animation: move 20s infinite alternate;
        }

        .blob-1 {
          width: 400px;
          height: 400px;
          top: -100px;
          left: -100px;
          background: #1e40af;
        }

        .blob-2 {
          width: 500px;
          height: 500px;
          bottom: -150px;
          right: -150px;
          background: #4f46e5;
          animation-delay: -5s;
        }

        @keyframes move {
          from { transform: translate(0, 0); }
          to { transform: translate(100px, 100px); }
        }

        .restriction-content {
          position: relative;
          max-width: 500px;
          width: 100%;
          margin: auto; /* Centers horizontally and vertically if space allows */
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          flex-shrink: 0; /* Prevent shrinking if screen is very small */
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .header-visual {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .icon-main {
          position: relative;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
        }

        .icon-main :global(.material-icons-round) {
          font-size: 2.5rem;
          color: white;
        }

        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 20px;
          border: 2px solid #3b82f6;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .device-comparison {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.75rem 1.25rem;
          border-radius: 50px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .device-icon {
          font-size: 1.5rem;
          color: #475569;
        }

        .device-icon.active {
          color: #3b82f6;
        }

        .connector {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .connector-line {
          width: 30px;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
        }

        .connector-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
        }

        .text-content {
          text-align: center;
        }

        .gradient-text {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(to right, #f8fafc, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1rem;
          letter-spacing: -0.03em;
        }

        .description {
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 2rem;
          font-size: 1.05rem;
        }

        .description strong {
          color: #3b82f6;
          font-weight: 600;
        }

        .width-tracker {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 20px;
          padding: 1.25rem;
          margin-bottom: 2rem;
          text-align: left;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .tracker-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .current-value {
          color: #f43f5e;
        }

        .progress-bar-container {
          position: relative;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(to right, #f43f5e, #3b82f6);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .target-marker {
          position: absolute;
          top: -4px;
          width: 2px;
          height: 16px;
          background: white;
          transform: translateX(-100%);
        }

        .marker-label {
          position: absolute;
          top: 20px;
          right: 0;
          font-size: 0.75rem;
          color: #94a3b8;
          white-space: nowrap;
        }

        .restriction-info {
          display: grid;
          gap: 1rem;
          margin-top: 2rem;
        }

        .info-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 1rem;
          border-radius: 16px;
          text-align: left;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .info-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(5px);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .info-card.highlight {
          border-color: rgba(59, 130, 246, 0.2);
        }

        .info-icon {
          width: 44px;
          height: 44px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .info-icon :global(.material-icons-round) {
          color: #3b82f6;
          font-size: 1.25rem;
        }

        .info-text h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: #f1f5f9;
        }

        .info-text p {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }

        .footer {
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #64748b;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 50px;
        }

        .dot {
          width: 6px;
          height: 6px;
          background: #f59e0b;
          border-radius: 50%;
          animation: blink 1.5s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
