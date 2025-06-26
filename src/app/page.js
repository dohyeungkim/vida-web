'use client';
import React, { useEffect, useState, useRef } from "react";
import "./CanvasPage.css";

export default function CanvasPage() {
  const canvasRef = useRef(null);
  const [data, setData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null); 

  const originalWidth = 1280;
  const originalHeight = 1280;
  const FRAME_DATA_API_URL = "http://220.66.153.50:8080/frame";
  const scaleRatio = 0.7; 
  const padding = 10; 

  useEffect(() => {
    fetch(FRAME_DATA_API_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
      })
      .then((responseData) => {
        const personList = responseData.personList || [];
        const itemList = responseData.itemList || [];
        const stringData = [
          `capturedAt: ${responseData.capturedAt}`,
          `width: ${responseData.width}`,
          `height: ${responseData.height}`,
          `maxSeverity: ${responseData.maxSeverity}`,
        ];

        personList.forEach((p, i) => {
          stringData.push(`personList[${i}]: severity=${p.severity}, poseType=${p.poseType}`);
        });
        itemList.forEach((it, i) => {
          stringData.push(`itemList[${i}]: itemType=${it.itemType}`);
        });

        const scale = (val, axis) => val * scaleRatio;

        const scalePointsWithLabel = (xlist, ylist, label, severity) => ({
          x1: scale(xlist[0], 'x'), y1: scale(ylist[0], 'y'),
          x2: scale(xlist[1], 'x'), y2: scale(ylist[1], 'y'),
          x3: scale(xlist[2], 'x'), y3: scale(ylist[2], 'y'),
          x4: scale(xlist[3], 'x'), y4: scale(ylist[3], 'y'),
          label, severity
        });

        const personPolygons = personList.map(entry =>
          scalePointsWithLabel(entry.xlist, entry.ylist, "P", entry.severity)
        );
        const itemPolygons = itemList.map(entry =>
          scalePointsWithLabel(entry.xlist, entry.ylist, entry.itemType)
        );

        setData({ stringData, personPolygons, itemPolygons });
      })
      .catch((error) => {
        console.error("데이터를 받아오는 중 오류 발생:", error);
        setData(null);
      });
  }, []);

  useEffect(() => {
    if (!data || selectedRoom !== 1) return; 

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");

    const allPoints = [...data.personPolygons, ...data.itemPolygons].flatMap(p => [
      { x: p.x1, y: p.y1 },
      { x: p.x2, y: p.y2 },
      { x: p.x3, y: p.y3 },
      { x: p.x4, y: p.y4 },
    ]);

    const minX = Math.min(...allPoints.map(p => p.x));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    const maxY = Math.max(...allPoints.map(p => p.y));

    const extraTopPadding = 30;

    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2 + extraTopPadding;

    canvas.width = contentWidth;
    canvas.height = contentHeight;

    const offsetX = minX - padding;
    
    const offsetY = minY - padding - extraTopPadding;
    const translate = (x, y) => [x - offsetX, y - offsetY];

    const getCenter = (p) => ({
      x: (p.x1 + p.x2 + p.x3 + p.x4) / 4,
      y: (p.y1 + p.y2 + p.y3 + p.y4) / 4
    });

    ctx.fillStyle = "#e3f2fd";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    data.personPolygons.forEach(p => {
      ctx.beginPath();
      ctx.moveTo(...translate(p.x1, p.y1));
      ctx.lineTo(...translate(p.x2, p.y2));
      ctx.lineTo(...translate(p.x3, p.y3));
      ctx.lineTo(...translate(p.x4, p.y4));
      ctx.closePath();
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle =
        p.severity === "DANGER" ? "rgba(255,0,0,0.4)" :
        p.severity === "FALL" ? "rgba(255,255,0,0.4)" :
        "rgba(0,0,0,0.1)";
      ctx.fill();

      const { x, y } = getCenter(p);
      ctx.fillStyle = "red";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.label, ...translate(x, y));
    });

    data.itemPolygons.forEach(p => {
      ctx.beginPath();
      ctx.moveTo(...translate(p.x1, p.y1));
      ctx.lineTo(...translate(p.x2, p.y2));
      ctx.lineTo(...translate(p.x3, p.y3));
      ctx.lineTo(...translate(p.x4, p.y4));
      ctx.closePath();
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,255,0.2)";
      ctx.fill();

      const { x, y } = getCenter(p);
      ctx.fillStyle = "blue";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.label, ...translate(x, y));
    });

  }, [data,selectedRoom]);

  return (
    <>
    <div className="top-bar">
      <div className="logo">VIDA</div>
      <div className="navbar">
        <button onClick={() => window.location.reload()}>Home</button>
        <button onClick={() => alert("Device 페이지는 구현 예정입니다.")}>Device</button>
        <button onClick={() => alert("Record 페이지는 구현 예정입니다.")}>Record</button>
      </div>
    </div>  
    
    <div className="container">
      <div className="left-panel">
        <h2>데이터 목록</h2>
        {data ? (
          <ul>
            {data.stringData.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    {selectedRoom === 1 && (
      <div className="center-panel">
        <canvas ref={canvasRef} className="canvas" />
      </div>
    )}
      <div className="right-panel">
        <div className="legend">
          <div className="legend-item">
            <div className="dot danger"></div>
            <span>Danger</span>
          </div>
          <div className="legend-item">
            <div className="dot fall"></div>
            <span>Fall</span>
          </div>
          <div className="legend-item">
            <div className="dot safe"></div>
            <span>안전</span>
          </div>  
          
          <div className="room-list">
          <button className="room-button" onClick={() => setSelectedRoom(1)}>1병실</button>
          <button className="room-button" onClick={() => setSelectedRoom(2)}>2병실</button>
          <button className="room-button" onClick={() => setSelectedRoom(3)}>3병실</button>
          <button className="room-button" onClick={() => setSelectedRoom(4)}>4병실</button>
      
          </div>
        </div>
      </div>
    </div>
  </>      
  );
}