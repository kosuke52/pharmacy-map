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
        Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8')
      ),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = '1QSv4XVpAdzAfAUztNHSmZ0GH2CGu_-vvvUvsrvcGbHQ'; // ← ここをあなたのIDに置き換え！

    // 日本時間での送信日時を生成
    const now = new Date();
    const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const timestamp = jstDate.toISOString().replace('T', ' ').substring(0, 19);

    const row = [
      timestamp, // JST形式 "YYYY-MM-DD HH:MM:SS"
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
