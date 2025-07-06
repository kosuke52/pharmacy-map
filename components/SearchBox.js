// components/SearchBox.js
'use client';

import { useState, useEffect, useRef } from 'react'; // useEffect と useRef をインポート

export default function SearchBox({ onSearch }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;

  // デバウンス用のタイマーを保持するref
  const debounceTimeoutRef = useRef(null);

  // 検索クエリの変更ハンドラ
  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value); // 入力フィールドの値を即座に更新

    // 既存のタイマーがあればクリア
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // 新しいタイマーを設定
    debounceTimeoutRef.current = setTimeout(() => {
      if (value.length >= 3) { // 最低3文字からサジェストを有効にするのは維持
        fetchSuggestions(value);
      } else {
        setSuggestions([]); // 3文字未満ならサジェストをクリア
      }
    }, 1000); // ★1秒 (1000ミリ秒) のデバウンス時間
  };

  // 実際のサジェスト取得API呼び出し関数
  const fetchSuggestions = async (searchText) => {
    setLoading(true);
    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchText)}&apiKey=${GEOAPIFY_KEY}&lang=ja`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.features) {
        setSuggestions(data.features.map(f => ({
          name: f.properties.formatted,
          lat: f.properties.lat,
          lon: f.properties.lon,
        })));
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]); // エラー時はサジェストをクリア
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントがアンマウントされるときにタイマーをクリア (クリーンアップ)
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []); // 依存配列が空なので、マウント時とアンマウント時のみ実行

  // サジェストの選択時の処理
  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.name);
    setSuggestions([]);
    onSearch(suggestion.lat, suggestion.lon);
  };

  // 検索ボタン押下時またはEnterキー押下時の処理（サジェストを使わない最終検索）
  const handleManualSearch = async () => {
    if (!query.trim()) return; // 空欄なら何もしない
    setLoading(true);
    // デバウンス中のタイマーがあればクリアし、即座に検索を実行
    if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
    }

    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_KEY}&lang=ja&limit=1`;
      const response = await fetch(url);
      const data = await response.json();
      const properties = data?.features?.[0]?.properties; // オプショナルチェイニングを使用

      if (properties) { // properties が存在する場合のみ処理を進める
        const { lat, lon } = properties; // properties オブジェクトから lat と lon を取得
        setSuggestions([]);
        onSearch(lat, lon);
      } else {
        // properties が存在しない場合、または検索結果がない場合
        alert('指定された場所が見つかりませんでした。');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('検索中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '10px', background: '#f8f8f8', borderBottom: '1px solid #eee', position: 'relative' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="住所や地名で検索..."
          value={query}
          onChange={handleQueryChange} // デバウンスを導入したハンドラ
          onKeyPress={(e) => { 
            if (e.key === 'Enter') handleManualSearch(); // Enterキーで即座に検索
          }}
          style={{ flexGrow: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          disabled={loading}
        />
        <button
          onClick={handleManualSearch} // 検索ボタンで即座に検索
          style={{ padding: '8px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          disabled={loading}
        >
          {loading ? '検索中...' : '検索'}
        </button>
      </div>

      {suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: '10px', right: '10px',
          backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px',
          zIndex: 1001, listStyle: 'none', margin: 0, padding: 0, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          {suggestions.map((s, index) => (
            <li key={index}
              onClick={() => handleSelectSuggestion(s)}
              style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }}
            >
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}