// components/MapComponent.js
'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect, useRef } from 'react';
import { fetchPharmacies } from '../lib/fetchPharmacies';
import PharmacySlider from './PharmacySlider'; // PharmacySliderをインポート

// CSS Modulesをインポート
import mapStyles from './MapComponent.module.css';
import infoStyles from './PharmacyInfo.module.css';
import sliderStyles from './PharmacySlider.module.css';

// customIcon の定義は変更なし（L.icon のまま）
const customIcon = L.icon({
  iconUrl: '/images/pharmacy_pin.png',
  iconSize: [64, 64],
  iconAnchor: [32, 64],
  popupAnchor: [0, -64]
});

export default function MapComponent({ center }) {
  const [pharmacies, setPharmacies] = useState([]);
  // mapHeight はもう不要か、flex: 1 で自動調整される
  // const [mapHeight, setMapHeight] = useState('500px'); // この行を削除
  const markerRefs = useRef([]);

 // useEffect(() => {
 //   if (!document.querySelector('link[href*="leaflet.css"]')) {
 //     const link = document.createElement('link');
 //     link.rel = 'stylesheet';
 //     link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
 //     document.head.appendChild(link);
 //   }
 // }, []);

  useEffect(() => {
    fetchPharmacies().then(setPharmacies).catch(console.error);
  }, []);
  useEffect(() => {
    const update = () => {
      // 親コンポーネントが Flexbox で高さを制御するため、この useEffect は不要です
      // もし、これでレイアウトが崩れる場合は、親のAppRouterのレイアウトを確認する必要があります
    };
    // update(); // この行も不要
    // window.addEventListener('resize', update); // この行も不要
    // return () => window.removeEventListener('resize', update); // この行も不要
  }, []);
  // mapHeight の useEffect は削除 (Flexboxが高さを制御するため)
  // useEffect(() => {
  //   const update = () => setMapHeight(`${window.innerHeight - 160}px`);
  //   update();
  //   window.addEventListener('resize', update);
  //   return () => window.removeEventListener('resize', update);
  // }, []);

  const handleSelect = idx => {
    const ph = pharmacies[idx];
    const m = markerRefs.current[idx];
    if (m && m._map) {
      const map = m._map;
      map.setView([ph.lat - 0.002, ph.lng], map.getZoom());
      m.openPopup();
    }
  };

  const handleRequest = async (ph, values) => {
    const payload = { ...ph, userName: values.name, userKana: values.kana, userPhone: values.phone };
    const res = await fetch('/api/request', { method: 'POST', headers:{ 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    alert(res.ok ? 'リクエスト送信済み' : 'エラー発生');
  };

  if (!center) return <div className={mapStyles.loadingMessage}>現在地取得中…</div>;

  return (
    // MapComponent 自体は Flexbox の子要素として残りの高さを埋める
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <MapContainer center={center} zoom={16} zoomControl={false} style={{ height: '100%', width:'100%' }}> {/* ★height を '100%' に変更 */}
         {/* ★ここに ChangeView コンポーネントを追加 ★ */}
         <ChangeView center={center} zoom={16} />
        <TileLayer url={`https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`} attribution='&copy; MapTiler &copy; OpenStreetMap contributors'/>
        {pharmacies.map((ph,i) => ph.lat && ph.lng && (
          <Marker key={i} position={[ph.lat,ph.lng]} icon={customIcon} ref={el=>markerRefs.current[i]=el}>
            <Popup>
              <PharmacyInfo ph={ph} onSubmit={values => handleRequest(ph, values)} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* PharmacySlider の position: absolute を削除し、通常のFlexアイテムにする */}
      <PharmacySlider
        pharmacies={pharmacies}
        center={center}
        onSelect={handleSelect}
      />
    </div>
  );
}
// ★★★ ここから新しいコンポーネントを追加 ★★★
// 地図のビュー（中心とズーム）を変更するためのヘルパーコンポーネント
function ChangeView({ center, zoom }) {
  const map = useMap(); // 現在のMapContainerのインスタンスにアクセス

  useEffect(() => {
    if (center) {
      // 地図の中心を新しい座標に設定し、アニメーションで移動
      map.setView(center, zoom, {
        animate: true,
        duration: 0.5, // 0.5秒かけて移動
      });
    }
  }, [center, zoom, map]); // centerまたはzoomが変更されたときに実行

  return null; // このコンポーネントはUIをレンダリングしない
}

// PharmacyInfo コンポーネント
function PharmacyInfo({ ph, onSubmit }) {
  const [vals, setVals] = useState({ name:'', kana:'', phone:'' });
  const [showForm, setShowForm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVals(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={infoStyles.popupContainer}>
      <h3 className={infoStyles.pharmacyName}>
        {ph.name}
      </h3>

      <div className={infoStyles.contactInfo}>
        <p style={{ margin: '0 0 5px 0', fontSize: '15px' }}>{ph.address}</p>
        <p style={{ margin: '0', fontSize: '15px', color: '#555' }}>
          電話番号：<a href={`tel:${ph.tel}`} className={infoStyles.contactLink}>{ph.tel}</a>
        </p>
      </div>

      <div className={infoStyles.businessHoursSection}>
        <h4 className={infoStyles.businessHoursTitle}>営業時間</h4>
        <p className={infoStyles.businessHoursNote}>
          営業時間は、薬局のwebサイトなどで必ずご確認ください。
        </p>
        <table className={infoStyles.businessHoursTable}>
          <tbody>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'holiday']
              .map((d, i) => ph[d] && (
                <tr key={d} className={infoStyles.tableRow}>
                  <td className={infoStyles.tableCellDay}>
                    {['月', '火', '水', '木', '金', '土', '日', '祝'][i]}
                  </td>
                  <td className={infoStyles.tableCellTime}>{ph[d]}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {showForm ? (
        <div className={infoStyles.inputFormContainer}>
          <label className={infoStyles.inputLabel}>
            氏名：<input
              type="text"
              name="name"
              placeholder="山田太郎"
              value={vals.name}
              onChange={handleChange}
              className={infoStyles.textInput}
            />
          </label>
          <label className={infoStyles.inputLabel}>
            氏名（ひらがな）：<input
              type="text"
              name="kana"
              placeholder="やまだたろう"
              value={vals.kana}
              onChange={handleChange}
              className={infoStyles.textInput}
            />
          </label>
          <label className={infoStyles.inputLabel} style={{ marginBottom: '15px' }}>
            携帯番号：<input
              type="tel"
              name="phone"
              placeholder="09012345678"
              value={vals.phone}
              onChange={handleChange}
              className={infoStyles.textInput}
            />
          </label>
          <button
            onClick={(e) => { // ★イベントオブジェクトを受け取る
              e.stopPropagation(); // ★イベントの伝播を停止
               // ★バリデーションロジックの追加
               if (!vals.name || !vals.kana || !vals.phone) {
                alert('氏名、氏名（ひらがな）、携帯番号はすべて入力してください。');
                return; // 送信を中止
              }
              onSubmit(vals);
            }}
            className={infoStyles.primaryButton}
          >
            依頼する
          </button> {/* ★ボタンのテキスト変更 */}
        </div>
      ) : (
        <button
        onClick={(e) => { // ★イベントオブジェクトを受け取る
          e.stopPropagation(); // ★イベントの伝播を停止
          setShowForm(true);
        }}
        className={infoStyles.primaryButton}
        >
          この薬局を選択する
        </button>
      )}
    </div>
  );
}