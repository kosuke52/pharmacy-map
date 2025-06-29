'use client';  // これがないと地図が動きません

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// 地図部分を別ファイルに分けて、クライアントサイドのみで読み込む
const MapComponent = dynamic(() => import('../components/MapComponent'), {
  ssr: false,
});

export default function Page() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapComponent />
    </div>
  );
}