import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: '検索クエリが必要です' }, { status: 400 });
    }

    const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'PharmacyMapApp/1.0 (your-email@example.com)',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Nominatim APIからの応答に失敗しました' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Nominatim APIエラー:', error);
    return NextResponse.json({ error: '内部エラーが発生しました' }, { status: 500 });
  }
}