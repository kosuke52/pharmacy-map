// components/PharmacyMap.js
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css'; // この行を削除！

import L from 'leaflet';
import { useEffect } from 'react';

// publicフォルダからの相対パスを使う (publicフォルダにこれらの画像を配置してください)
const iconRetinaUrl = '/marker-icon-2x.png';
const iconUrl = '/marker-icon.png';
const shadowUrl = '/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

export default function PharmacyMap({ pharmacies, onSelectMarker, center }) {
  // Leaflet CSSを動的に読み込むためのuseEffect
  useEffect(() => {
    // コンポーネントがマウントされた後にのみCSSをロード
    import('leaflet/dist/leaflet.css')
      .then(() => {
        // console.log('Leaflet CSS loaded successfully');
      })
      .catch(err => {
        console.error('Failed to load Leaflet CSS:', err);
      });
  }, []);

  const initialZoom = 13; // ズームレベルは固定でOK

  // カスタムアイコン（publicフォルダに画像を配置してください）
  const customIcon = new L.Icon({
    iconUrl: '/pharmacy-icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  return (
    <MapContainer center={center} zoom={initialZoom} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {pharmacies.map((ph, i) => (
        <Marker
          key={i}
          position={[ph.lat, ph.lng]}
          icon={customIcon}
          eventHandlers={{
            click: () => {
              onSelectMarker(i);
            },
          }}
        >
          <Popup>
            <div>
              <h3>{ph.name}</h3>
              <p>{ph.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}