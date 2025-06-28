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
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    // 入力検証
    if (!email || !name || !password) {
      return new Response(JSON.stringify({ 
        error: 'メールアドレス、名前、パスワードが必要です' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // メールアドレス形式検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ 
        error: '正しいメールアドレス形式で入力してください' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ユーザー登録
    const result = await authService.register({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password
    });

    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: result.error 
      }), {
        status: 400,
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
        emailVerified: result.user?.emailVerified
      }
    }), {
      status: 201,
      headers
    });

  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    return new Response(JSON.stringify({ 
      error: 'サーバーエラーが発生しました' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}