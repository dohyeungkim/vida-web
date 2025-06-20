'use client';
import { useEffect, useState } from 'react';

export default function Page() {
  const [frame, setFrame] = useState(null);

  // 🔔 트리거: 버튼 클릭 시 트리거 API 호출
  const triggerFallEvent = async () => {
    try {
      await fetch('http://220.66.153.50:8080/stream/create/fall', {
        method: 'GET', // 또는 POST (백엔드 방식에 맞게)
      });
      console.log('트리거 전송 완료');
    } catch (e) {
      console.error('트리거 전송 실패', e);
    }
  };

  // 🔁 SSE 구독
  useEffect(() => {
    const source = new EventSource('http://220.66.153.50:8080/stream/subscribe');

    source.addEventListener('frame', (event) => {
      try {
        const raw = JSON.parse(event.data);

        setFrame({
          capturedAt: raw.capturedAt,
          maxSeverity: raw.maxSeverity,
          personList: raw.personList?.map(p => ({
            severity: p.severity,
            poseType: p.poseType,
          })) ?? [],
          itemList: raw.itemList?.map(i => ({
            itemType: i.itemType,
          })) ?? [],
        });
      } catch (e) {
        console.error('파싱 오류:', e);
      }
    });

    source.onerror = (e) => {
      console.error('SSE 오류:', e);
      source.close();
    };

    return () => source.close();
  }, []);

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <button onClick={triggerFallEvent} style={{ padding: '10px', backgroundColor: 'white', color: 'black', marginBottom: '20px' }}>
        📤 낙상 이벤트 트리거 전송
      </button>

      {!frame ? (
        <p>⏳ 스트림을 기다리는 중입니다...</p>
      ) : (
        <div>
          <h2>📡 수신된 이벤트</h2>
          <p><b>Captured At:</b> {frame.capturedAt}</p>
          <p><b>Max Severity:</b> {frame.maxSeverity}</p>

          <h3>👤 Person List</h3>
          <ul>
            {frame.personList.map((p, i) => (
              <li key={i}>
                <b>Severity:</b> {p.severity} / <b>Pose:</b> {p.poseType}
              </li>
            ))}
          </ul>

          <h3>🛏️ Item List</h3>
          <ul>
            {frame.itemList.map((i, idx) => (
              <li key={idx}>
                <b>Item Type:</b> {i.itemType}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}