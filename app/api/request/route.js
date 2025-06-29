import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

console.log('📁 存在チェック:', fs.existsSync(path.join(process.cwd(), 'google-service-account.json')));
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('受信したデータ:', body);

    const {
      userName,
      userKana,
      userPhone,
      name,
      address,
      tel,
      fax,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    } = body;

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'google-service-account.json'), 'utf8')
      ),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = '1QSv4XVpAdzAfAUztNHSmZ0GH2CGu_-vvvUvsrvcGbHQ'; // ← ここをあなたのIDに置き換え！

    const row = [
      new Date().toLocaleString('ja-JP'), // 送信日時
      userName,
      userKana,
      userPhone,
      name,
      address,
      tel,
      fax,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'シート1!A1', // シート名が違う場合はここを修正
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return new Response(JSON.stringify({ message: '依頼を受け付けました！' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('エラー:', error);
    return new Response(JSON.stringify({ message: 'エラーが発生しました' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
