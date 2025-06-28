import { type LoaderFunctionArgs } from 'react-router';
import { createDB } from '../lib/db';
import { getAuthService } from '../lib/auth';

export async function loader({ request, context }: LoaderFunctionArgs) {
  try {
    const db = createDB(context.cloudflare.env.DB);
    const authService = getAuthService(db);

    // Cookieからセッショントークンを取得
    const cookies = request.headers.get('cookie') || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const sessionToken = sessionMatch ? sessionMatch[1] : null;

    if (!sessionToken) {
      return new Response(JSON.stringify({ 
        authenticated: false,
        error: 'セッションが見つかりません' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // セッション検証
    const sessionData = await authService.validateSession(sessionToken);

    if (!sessionData) {
      // 無効なセッションの場合、Cookieを削除
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
      });

      return new Response(JSON.stringify({ 
        authenticated: false,
        error: 'セッションが無効です' 
      }), {
        status: 401,
        headers
      });
    }

    return new Response(JSON.stringify({
      authenticated: true,
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        emailVerified: sessionData.user.emailVerified,
        lastLoginAt: sessionData.user.lastLoginAt,
        createdAt: sessionData.user.createdAt
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('認証確認エラー:', error);
    return new Response(JSON.stringify({ 
      authenticated: false,
      error: 'サーバーエラーが発生しました' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}