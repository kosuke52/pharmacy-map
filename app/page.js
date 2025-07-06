// app/map-test/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SearchBox from '@/components/SearchBox';

const DynamicMapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <p>地図を読み込み中...</p>,
});

export default function MapTestPage() {
  const [mapCenter, setMapCenter] = useState(null);

  const dummyPharmacies = [
    { name: '薬局A', address: '東京都千代田区丸の内1-9-1', lat: 35.681236, lng: 139.767125 }, // 東京駅
    { name: '薬局B', address: '東京都千代田区大手町1-1-1', lat: 35.689436, lng: 139.753825 },
    { name: '薬局C', address: '東京都中央区銀座4-6-1', lat: 35.670167, lng: 139.763567 },
  ];

  useEffect(() => {
    let isMounted = true;
    const defaultCenter = [dummyPharmacies[0].lat, dummyPharmacies[0].lng];

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMounted) {
            setMapCenter([position.coords.latitude, position.coords.longitude]);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (isMounted) {
            setMapCenter(defaultCenter);
          }
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
        }
      );
    } else {
      if (isMounted) {
        setMapCenter(defaultCenter);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = useCallback(async (lat, lon) => {
    setMapCenter([lat, lon]);
  }, []);

  return (
    <div style={{
      display: 'flex',          // ★Flexboxコンテナにする
      flexDirection: 'column',  // ★子要素を縦に並べる
      height: '100vh',          // ★ビューポートの高さ全体を使う
      overflow: 'hidden'        // ★スクロールバーが出ないように隠す
    }}>
      
      <SearchBox onSearch={handleSearch} />
      {mapCenter ? (
        // 地図コンポーネントが残りのスペースを占めるように flex: 1 を適用
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}> {/* ★flex: 1 を適用する新しいdivでラップ */}
          <DynamicMapComponent center={mapCenter} />
        </div>
      ) : (
        <p style={{ textAlign: 'center', padding: '20px' }}>地図を読み込み中、または現在地取得中...</p>
      )}
      {/* PharmacySlider は MapComponent 内で使われているため、ここには不要です */}
      {/* <PharmacySlider /> */}
    </div>
  );
}