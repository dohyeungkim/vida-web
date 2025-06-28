'use client';
import React, { useState, useEffect, useRef } from 'react';
import './CanvasPage.css';

function Page() {
  const [capturedAt, setCapturedAt] = useState(null);
  const [width, setWidth] = useState(null);
  const [height, setHeight] = useState(null);
  const [maxSeverity, setMaxSeverity] = useState(null);
  const [personList, setPersonList] = useState([]);
  const [itemList, setItemList] = useState([]);
  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const canvasRef = useRef(null);

  const images = useRef({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const imgMap = {
      STAND: new Image(),
      LYING: new Image(),
      SIT: new Image(),
      SQUAT: new Image(),
      BOW: new Image(),
      bed_left: new Image(),
      bed_right: new Image(),
      logo: new Image(),
    };

    imgMap.STAND.src = "/stand.png";
    imgMap.LYING.src = "/lying.png";
    imgMap.SIT.src = "/sit.png";
    imgMap.SQUAT.src = "/squat.png";
    imgMap.BOW.src = "/bow.png";
    imgMap.bed_left.src = "/bed_left.png";
    imgMap.bed_right.src = "/bed_right.png";
    imgMap.logo.src = "logo.png";

    let loaded = 0;
    const total = Object.keys(imgMap).length;

    Object.values(imgMap).forEach((img) => {
      img.onload = () => {
        loaded++;
        if (loaded === total) {
          images.current = imgMap;
          setImagesLoaded(true);
        }
      };
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);

      const handleResize = () => {
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;

    const eventSource = new EventSource('http://220.66.153.50:8080/stream/realtime');
    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setCapturedAt(parsedData.capturedAt);
        setWidth(parsedData.width);
        setHeight(parsedData.height);
        setMaxSeverity(parsedData.maxSeverity);
        setPersonList(parsedData.personList || []);
        setItemList(parsedData.itemList || []);
      } catch (error) {
        console.error('Error parsing JSON data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [selectedRoom]);

  useEffect(() => {
    if (!canvasRef.current || !width || !height || !imagesLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    const aspectRatio = width / height;
    let canvasWidth = windowWidth * 0.6;
    let canvasHeight = canvasWidth / aspectRatio;

    if (canvasHeight > windowHeight * 0.8) {
      canvasHeight = windowHeight * 0.8;
      canvasWidth = canvasHeight * aspectRatio;
    }

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'gray';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('Data Visualization', 10, 50);

    personList.forEach((person) => {
      const x = person.centerX - person.width / 2;
      const y = person.centerY - person.height / 2;

      ctx.beginPath();
      ctx.arc(person.centerX, person.centerY, person.width / 2, 0, Math.PI * 2);
      switch (person.severity) {
        case 'FALL': ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; break;
        case 'DANGER': ctx.fillStyle = 'rgba(255, 165, 0, 0.5)'; break;
        case 'CAUTION': ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'; break;
        case 'NORMAL': ctx.fillStyle = 'rgba(0, 255, 0, 0.5)'; break;
        default: ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
      }
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.stroke();

      const poseKey = (person.poseType || "STAND").toUpperCase();
      const poseImage = images.current[poseKey] || images.current.STAND;
      ctx.drawImage(poseImage, x, y, person.width, person.height);
      
    });

    itemList.forEach((item) => {
      const x = item.centerX - item.width / 2;
      const y = item.centerY - item.height / 2;

      const bedImage = item.horz === 'LEFT' ? images.current.bed_left : images.current.bed_right;
      ctx.drawImage(bedImage, x, y, item.width, item.height);

      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`bed${item.ID}`, item.centerX, item.centerY);
    });
  }, [width, height, personList, itemList, windowWidth, windowHeight, imagesLoaded]);

  return (
    <div>
      <div className="navbar">
        <div className="logo">
          <img src="logo.png" alt="Logo" />
        </div>
      </div>

      <div className="container">
        <div className="left-panel">
          <div className="left-section section1">
            <h2>Basic Info</h2>
            {capturedAt && maxSeverity ? (
              <div>
                <p><strong>Captured At:</strong> {capturedAt}</p>
                <p><strong>Max Severity:</strong> {maxSeverity}</p>
              </div>
            ) : (
              <p>Waiting for data...</p>
            )}
          </div>
          <div className="left-section section2">
            <h2>Device Info</h2>
            <p><strong>Device:</strong> Jetson Orin Nano Super</p>
            <p><strong>OS:</strong> Jetpack 6.2</p>
            <p><strong>CAMERA:</strong> Reolink Fisheye-view Camera FE-P</p>
          </div>
          <div className="left-section section3">
            <p style={{ color: 'gray' }}>🔔 실시간 알림 공간 (예정)</p>
          </div>
        </div>

        <div className="center-panel">
          {selectedRoom && width && height ? (
            <div className="canvas-container">
              <canvas ref={canvasRef} style={{ border: '1px solid #000' }} />
              <p><strong>Resolution:</strong> {width}x{height}</p>
            </div>
          ) : (
            <p>Select a room to start visualization.</p>
          )}
        </div>

        <div className="right-panel">
          <div className="right-section right-half">
            <h2>Room Selection</h2>
            <button className="room-button" onClick={() => setSelectedRoom("101")}>101호</button>
            <button className="room-button" onClick={() => setSelectedRoom("102")}>102호</button>
            <button className="room-button" onClick={() => setSelectedRoom("103")}>103호</button>
          </div>
          <div className="right-section right-half">
            <div className="legend">
              <h3>Severity Levels</h3>
              <div className="legend-item"><span className="dot fall"></span> Fall</div>
              <div className="legend-item"><span className="dot danger"></span> Danger</div>
              <div className="legend-item"><span className="dot caution"></span> Caution</div>
              <div className="legend-item"><span className="dot normal"></span> Normal</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;

