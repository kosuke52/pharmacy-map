'use client';

import 'leaflet/dist/leaflet.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { fetchPharmacies } from '../lib/fetchPharmacies';

// ここでカスタムマーカーを作成！
const customIcon = L.divIcon({
  html: `
    <div style="
      width: 46px;
      height: 62px;
      background: #2196f3;
      clip-path: path('M23 0C10 0 0 10 0 23c0 15 23 39 23 39s23-24 23-39C46 10 36 0 23 0z');
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 7px;
    ">
      <i class="fas fa-pills" style="color: white; font-size: 20px;"></i>
    </div>
  `,
  className: '',
  iconSize: [46, 62],
  iconAnchor: [23, 62],
  popupAnchor: [0, -62],
});

export default function MapComponent() {
  const [pharmacies, setPharmacies] = useState([]);
  const [center, setCenter] = useState(null); // 初期は null

  const handleInputChange = (index, field, value) => {
    setPharmacies((prev) => {
      const newPharmacies = [...prev];
      newPharmacies[index] = {
        ...newPharmacies[index],
        [field]: value,
      };
      return newPharmacies;
    });
  };
  

  useEffect(() => {
    fetchPharmacies()
      .then((data) => {
        console.log('読み込んだ薬局データ:', data);
        setPharmacies(data);
      })
      .catch((err) => console.error('CSV 読み込みエラー:', err));
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCenter([latitude, longitude]);
          },
          (err) => {
            console.error('現在地取得エラー:', err);
            // fallback: 東京駅
            setCenter([35.681236, 139.767125]);
          }
        );
      } else {
        setCenter([35.681236, 139.767125]);
      }
    }, []);

    if (!center) {
        return <div style={{ padding: '1rem', textAlign: 'center' }}>現在地を取得中です...</div>;
      }
      

  const handleRequest = async (pharmacy) => {
    const { nameInput, kanaInput, phoneInput, ...pharmacyInfo } = pharmacy;
  
    const payload = {
      ...pharmacyInfo,
      userName: nameInput || '',
      userKana: kanaInput || '',
      userPhone: phoneInput || '',
    };
  
    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (res.ok) {
        alert('依頼を送信しました！');
      } else {
        alert('送信に失敗しました。');
      }
    } catch (err) {
      console.error('送信エラー:', err);
      alert('エラーが発生しました。');
    }
  };
  

  return (
    <>
      {Array.isArray(center) && center.length === 2 && typeof center[0] === 'number' && typeof center[1] === 'number' && (
        <MapContainer center={center} zoom={16} style={{ height: '100%', width: '100%' }}>
          <SearchControl />
          <TileLayer
            url="https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=zPn0UsRjVwhwZXQ2Ordt"
            attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {pharmacies.map((ph, i) => {
            if (!ph.lat || !ph.lng) return null;
            return (
              <Marker key={i} position={[ph.lat, ph.lng]} icon={customIcon}>
                <Popup>
                  <strong>{ph.name}</strong><br />
                  {ph.address}<br />
                  TEL: {ph.tel} / FAX: {ph.fax}<br />
                  <hr />
                  <div style={{ fontSize: '0.9em' }}>
                    <div>月: {ph.monday || '休業'}</div>
                    <div>火: {ph.tuesday || '休業'}</div>
                    <div>水: {ph.wednesday || '休業'}</div>
                    <div>木: {ph.thursday || '休業'}</div>
                    <div>金: {ph.friday || '休業'}</div>
                    <div>土: {ph.saturday || '休業'}</div>
                    <div>日: {ph.sunday || '休業'}</div>
                  </div>
                  <hr />
                  <div style={{ fontSize: '0.9em', marginBottom: '4px' }}>
                    <label>
                      氏名：
                      <input
                        type="text"
                        placeholder="山田太郎"
                        value={ph.nameInput || ''}
                        onChange={(e) => handleInputChange(i, 'nameInput', e.target.value)}
                        style={{ width: '100%', marginTop: '2px' }}
                      />
                    </label>
                  </div>
                  <div style={{ fontSize: '0.9em', marginBottom: '4px' }}>
                    <label>
                      氏名（ひらがな）：
                      <input
                        type="text"
                        placeholder="やまだたろう"
                        value={ph.kanaInput || ''}
                        onChange={(e) => handleInputChange(i, 'kanaInput', e.target.value)}
                        onBlur={(e) => {
                          const value = e.target.value;
                          const hiraganaOnly = value.replace(/[^ぁ-んー\s]/g, '');
                          if (value !== hiraganaOnly) {
                            alert('ひらがな以外の文字が含まれていたため、自動修正しました');
                            handleInputChange(i, 'kanaInput', hiraganaOnly);
                          }
                        }}
                        style={{ width: '100%', marginTop: '2px' }}
                      />
                    </label>
                  </div>
                  <div style={{ fontSize: '0.9em', marginBottom: '4px' }}>
                    <label>
                      携帯番号（11桁）：
                      <input
                        type="tel"
                        maxLength={11}
                        pattern="\d*"
                        placeholder="09012345678"
                        value={ph.phoneInput || ''}
                        onChange={(e) => handleInputChange(i, 'phoneInput', e.target.value.replace(/\D/g, ''))}
                        style={{ width: '100%', marginTop: '2px' }}
                      />
                    </label>
                  </div>
                  <button onClick={() => handleRequest(ph)}>依頼</button>
                  <hr />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}
    </>
  );
} 


function SearchControl() {
  const inputRef = useRef(null);
  const map = useMap();

  const handleSearch = async () => {
    const query = inputRef.current.value;
    if (!query) return;
  
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const results = await res.json();
  
    if (results.length > 0) {
      const { lat, lon } = results[0];
      map.setView([parseFloat(lat), parseFloat(lon)], 15);
    } else {
      alert('場所が見つかりませんでした');
    }
  };  
  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert('このブラウザは現在地取得に対応していません');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 15);
      },
      (error) => {
        alert('現在地の取得に失敗しました');
        console.error(error);
      }
    );
};

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'white', padding: '5px', borderRadius: '4px' }}>
      <input type="text" ref={inputRef} placeholder="住所・地名" />
      <button onClick={handleSearch}>検索</button>
      <button onClick={handleLocate}>現在地</button>
    </div>
  );
}


