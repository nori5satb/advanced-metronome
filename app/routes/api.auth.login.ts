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

    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // 入力検証
    if (!email || !password) {
      return new Response(JSON.stringify({ 
        error: 'メールアドレスとパスワードが必要です' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // クライアント情報取得
    const ipAddress = request.headers.get('cf-connecting-ip') || 
                     request.headers.get('x-forwarded-for') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // ログイン処理
    const result = await authService.login({
      email: email.toLowerCase().trim(),
      password
    });

    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: result.error 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // セッション情報をCookieに設定
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Set-Cookie': `session=${result.session?.sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`
    });

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name,
        emailVerified: result.user?.emailVerified,
        lastLoginAt: result.user?.lastLoginAt
      }
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('ログインエラー:', error);
    return new Response(JSON.stringify({ 
      error: 'サーバーエラーが発生しました' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}