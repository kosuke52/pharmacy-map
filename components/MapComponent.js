// components/MapComponent.js
'use client';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect, useRef, useCallback } from 'react'; // useCallback をインポート
import { fetchPharmacies } from '../lib/fetchPharmacies';
import PharmacySlider from './PharmacySlider';

// CSS Modulesをインポート
import mapStyles from './MapComponent.module.css';
import infoStyles from './PharmacyInfo.module.css';

// customIcon の定義は変更なし
const customIcon = L.icon({
  iconUrl: '/images/pharmacy_pin.png',
  iconSize: [64, 64],
  iconAnchor: [32, 64],
  popupAnchor: [0, -64]
});

// MapComponent の定義
export default function MapComponent({ initialCenter }) {
  const [pharmacies, setPharmacies] = useState([]);
  const markerRefs = useRef([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMapCenter, setCurrentMapCenter] = useState(initialCenter);

  const mapRef = useRef(null); // MapContainerのインスタンスを保持するためのref

  useEffect(() => {
    fetchPharmacies().then(setPharmacies).catch(console.error);
  }, []);

  // initialCenter の変更を監視して currentMapCenter を更新 (検索窓からの移動に対応)
  useEffect(() => {
    if (initialCenter && (currentMapCenter === null || initialCenter[0] !== currentMapCenter[0] || initialCenter[1] !== currentMapCenter[1])) {
      setCurrentMapCenter(initialCenter);
      // 検索窓で地図が移動したら、地図自体もその位置に飛ぶ
      if (mapRef.current) {
        mapRef.current.setView(initialCenter, mapRef.current.getZoom(), {
          animate: true,
          duration: 0.5,
        });
      }
    }
  }, [initialCenter]); // currentMapCenterを依存配列から削除

  // モーダルが開いている時にページのスクロールをロック
  useEffect(() => {
      if (isModalOpen) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = '';
      }
      return () => {
          document.body.style.overflow = '';
      };
  }, [isModalOpen]);


  // handleSelect のロジックを変更: モーダルを開き、地図の中心をタップした薬局に移動し、スライダーを更新
  // useCallback を使用して、この関数が不要な再生成をしないようにする
  const handleSelect = useCallback(idx => {
    const ph = pharmacies[idx];
    if (ph) {
      setSelectedPharmacy(ph);
      setIsModalOpen(true);

      // 地図の中心をピンの場所にスムーズに移動
      if (mapRef.current) {
        mapRef.current.flyTo([ph.lat, ph.lng], mapRef.current.getZoom());
      }
      // ★重要: タップしたピンの薬局を中心にスライダーを更新するため、currentMapCenterを更新
      // ここでのState更新がスライダーのuseEffectをトリガーする
      setCurrentMapCenter([ph.lat, ph.lng]);
    }
  }, [pharmacies]); // pharmaciesが変更されたときにのみhandleSelectを再生成

  const handleRequest = async (ph, values) => {
    const payload = { ...ph, userName: values.name, userKana: values.kana, userPhone: values.phone };
    const res = await fetch('/api/request', { method: 'POST', headers:{ 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    alert(res.ok ? 'リクエスト送信済み' : 'エラー発生');
    if (res.ok) {
      setIsModalOpen(false);
      setSelectedPharmacy(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPharmacy(null);
  };

  // MapContainerの初期化時のみcurrentMapCenterを設定（地図がユーザー操作で動いてもStateは更新しない）
  const onMapReady = (mapEvent) => {
    mapRef.current = mapEvent.target; // Mapインスタンスをrefに保存
    setCurrentMapCenter([mapEvent.target.getCenter().lat, mapEvent.target.getCenter().lng]);
  };

  if (!initialCenter) return <div className={mapStyles.loadingMessage}>地図を読み込み中…</div>;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <MapContainer
        center={initialCenter} // MapContainerの初期centerは initialCenter のまま
        zoom={16}
        zoomControl={false}
        style={{ height: '100%', width:'100%' }}
        whenReady={onMapReady} // 地図が準備できたときにMapインスタンスを保存
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {pharmacies.map((ph,i) => ph.lat && ph.lng && (
          <Marker
            key={i}
            position={[ph.lat,ph.lng]}
            icon={customIcon}
            ref={el=>markerRefs.current[i]=el}
            eventHandlers={{
                click: () => handleSelect(i),
            }}
          >
          </Marker>
        ))}
      </MapContainer>

      {/* PharmacySlider は currentMapCenter (タップしたピンの座標) で更新される */}
      {currentMapCenter && ( // currentMapCenter が null でない場合にのみレンダリング
        <PharmacySlider
          pharmacies={pharmacies}
          center={currentMapCenter} // currentMapCenterを渡す
          onSelect={handleSelect} // スライダーからの選択もカスタムモーダルで開く
        />
      )}

      {isModalOpen && selectedPharmacy && (
        <div className={mapStyles.modalOverlay} onClick={closeModal}>
          <div className={mapStyles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={mapStyles.modalCloseButton} onClick={closeModal}>&times;</button>
            <PharmacyInfo ph={selectedPharmacy} onSubmit={values => handleRequest(selectedPharmacy, values)} />
          </div>
        </div>
      )}

    </div>
  );
}

// PharmacyInfo コンポーネントはそのまま (中略)
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
        <p className={infoStyles.contactAddress}>{ph.address}</p>
        <p className={infoStyles.contactTelFax}>
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
            氏名：
            <input
              type="text"
              name="name"
              placeholder="山田太郎"
              value={vals.name}
              onChange={handleChange}
              className={infoStyles.textInput}
            />
          </label>
          <label className={infoStyles.inputLabel}>
            氏名（ひらがな）：
            <input
              type="text"
              name="kana"
              placeholder="やまだたろう"
              value={vals.kana}
              onChange={handleChange}
              className={infoStyles.textInput}
            />
          </label>
          <label className={infoStyles.inputLabel}>
            携帯番号：
            <input
              type="tel"
              name="phone"
              placeholder="09012345678"
              value={vals.phone}
              onChange={handleChange}
              className={infoStyles.textInput}
              maxLength="11"
            />
          </label>
          <button
            onClick={(e) => {
              e.stopPropagation();
               if (!vals.name || !vals.kana || !vals.phone) {
                alert('氏名、氏名（ひらがな）、携帯番号はすべて入力してください。');
                return;
              }
              if (!/^\d{11}$/.test(vals.phone)) {
                alert('携帯番号は11桁の数字で入力してください。');
                return;
              }
              onSubmit(vals);
            }}
            className={infoStyles.primaryButton}
          >
            依頼する
          </button>
        </div>
      ) : (
        <button
        onClick={(e) => {
          e.stopPropagation();
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