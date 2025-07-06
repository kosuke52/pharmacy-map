// components/PharmacySlider.js
'use client';
import { useEffect, useState } from 'react';
import sliderStyles from './PharmacySlider.module.css'; // ★CSSモジュールをインポート

export default function PharmacySlider({ pharmacies, center, onSelect }) {
  const [nearby, setNearby] = useState([]);

  useEffect(() => {
    if (!center || pharmacies.length === 0) return;
    const [lat0, lng0] = center;
    const toRad = v => (v * Math.PI) / 180;
    const calcDist = (lat1, lng1) => {
      const dLat = toRad(lat1 - lat0);
      const dLng = toRad(lng1 - lng0);
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat0)) * Math.cos(toRad(lat1)) * Math.sin(dLng/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return 6371 * c;
    };

    const sorted = pharmacies
      .filter(ph => ph.lat && ph.lng)
      .map((ph, i) => ({ ...ph, idx: i, distance: calcDist(ph.lat, ph.lng) }))
      .sort((a,b) => a.distance - b.distance)
      .slice(0, 10);
    setNearby(sorted);
  }, [center, pharmacies]);

  return (
    <div className={sliderStyles.sliderContainer}> {/* ★クラス名を使用 */}
      {nearby.map(ph => (
        <div key={ph.idx}
          onClick={() => onSelect(ph.idx)}
          className={sliderStyles.pharmacyCard} // ★クラス名を使用
        >
          <div>
            <div className={sliderStyles.cardName}>{ph.name}</div>
            <div className={sliderStyles.cardAddress}>{ph.address}</div>
          </div>
           {ph.distance !== undefined && (
            <div className={sliderStyles.cardDistance}>
              {ph.distance.toFixed(2)} km
            </div>
          )}
        </div>  
      ))}
    </div>
  );
}