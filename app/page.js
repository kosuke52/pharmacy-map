// app/map-test/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SearchBox from '@/components/SearchBox';
// PharmacySlider は MapComponent 内でレンダリングされるため、ここでは直接インポートしません

const DynamicMapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <p>地図を読み込み中...</p>,
});

export default function MapTestPage() {
  // PharmacySlider にも渡すため、pharmacies をここで管理
  const [pharmacies, setPharmacies] = useState([]);
  // 地図の初期中心座標を管理するState
  // MapComponent に initialCenter として渡される
  const [initialMapCenter, setInitialMapCenter] = useState(null); // ★initialMapCenter に変更

  const dummyPharmacies = [
    { name: '薬局A', address: '東京都千代田区丸の内1-9-1', lat: 35.681236, lng: 139.767125 }, // 東京駅
    { name: '薬局B', address: '東京都千代田区大手町1-1-1', lat: 35.689436, lng: 139.753825 },
    { name: '薬局C', address: '東京都中央区銀座4-6-1', lat: 35.670167, lng: 139.763567 },
  ];

  useEffect(() => {
    // PharmacySlider 用に pharmacies を設定
    // 実際には fetchPharmacies() から取得するように後で変更可能
    setPharmacies(dummyPharmacies);

    let isMounted = true;
    const defaultCenter = [dummyPharmacies[0].lat, dummyPharmacies[0].lng];

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMounted) {
            setInitialMapCenter([position.coords.latitude, position.coords.longitude]); // ★setInitialMapCenter を使用
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (isMounted) {
            setInitialMapCenter(defaultCenter); // ★setInitialMapCenter を使用
          }
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
        }
      );
    } else {
      if (isMounted) {
        setInitialMapCenter(defaultCenter); // ★setInitialMapCenter を使用
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // handleSearch は MapComponent の initialCenter を更新するために使う
  const handleSearch = useCallback(async (lat, lon) => {
    setInitialMapCenter([lat, lon]); // ★setInitialMapCenter を使用
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* ページタイトルは削除済み */}
      <SearchBox onSearch={handleSearch} />
      {/* initialMapCenter がセットされたら地図を表示 */}
      {initialMapCenter ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* DynamicMapComponent に initialCenter と pharmacies を渡す */}
          <DynamicMapComponent
            initialCenter={initialMapCenter} // ★initialCenter プロップとして渡す
            pharmacies={pharmacies} // ★pharmacies プロップを渡す
          />
        </div>
      ) : (
        <p style={{ textAlign: 'center', padding: '20px' }}>地図を読み込み中、または現在地取得中...</p>
      )}
      {/* PharmacySlider は MapComponent 内で使われているため、ここには不要です */}
    </div>
  );
}