import { type ActionFunctionArgs } from 'react-router';
import { createDB } from '../lib/db';
import { getAuthService } from '../lib/auth';

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'メソッドが許可されていません' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = createDB(context.cloudflare.env.DB);
    const authService = getAuthService(db);

    // Cookieからセッショントークンを取得
    const cookies = request.headers.get('cookie') || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const sessionToken = sessionMatch ? sessionMatch[1] : null;

    if (sessionToken) {
      await authService.logout(sessionToken);
    }

    // Cookieを削除
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'ログアウトしました'
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('ログアウトエラー:', error);
    return new Response(JSON.stringify({ 
      error: 'サーバーエラーが発生しました' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}