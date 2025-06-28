import { createDB } from "../lib/db";
import { SongRepository } from "../lib/songs";
import { data } from "react-router";
import { validateSongData, checkRateLimit, getCorsHeaders, getSecurityHeaders } from "../lib/security";

export async function loader({ context, request }: any) {
  // セキュリティヘッダーとCORS設定
  const headers = {
    ...getSecurityHeaders(),
    ...getCorsHeaders(request.headers.get('origin'))
  };

  try {
    const db = createDB(context.cloudflare.env.DB);
    const songRepo = new SongRepository(db);
    
    const songs = await songRepo.getAllSongs();
    return data(songs, { headers });
  } catch (error) {
    console.error('楽曲取得エラー:', error);
    return data({ error: 'サーバーエラーが発生しました' }, { 
      status: 500,
      headers 
    });
  }
}

export async function action({ request, context }: any) {
  // セキュリティヘッダーとCORS設定
  const headers = {
    ...getSecurityHeaders(),
    ...getCorsHeaders(request.headers.get('origin'))
  };

  // レート制限チェック
  const clientIP = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-forwarded-for') || 
                   'unknown';
  
  if (!checkRateLimit(clientIP, 50, 60000)) {
    return data({ error: 'リクエスト数が制限を超えています' }, { 
      status: 429,
      headers 
    });
  }

  try {
    const db = createDB(context.cloudflare.env.DB);
    const songRepo = new SongRepository(db);
    
    const formData = await request.formData();
    const method = formData.get("_method") as string;
    
    switch (method) {
      case "POST": {
        // データバリデーション
        const rawData = {
          title: formData.get("title"),
          artist: formData.get("artist"),
          genre: formData.get("genre"),
          defaultTempo: formData.get("defaultTempo"),
          defaultTimeSignature: formData.get("defaultTimeSignature"),
        };

        const validatedData = validateSongData(rawData);
        
        const id = crypto.randomUUID();
        const song = await songRepo.createSong({
          id,
          ...validatedData,
        });
        
        return data(song, { status: 201, headers });
      }
      
      default:
        return data({ error: "メソッドが対応していません" }, { 
          status: 405,
          headers 
        });
    }
  } catch (error) {
    console.error('楽曲作成エラー:', error);
    const message = error instanceof Error ? error.message : 'サーバーエラーが発生しました';
    return data({ error: message }, { 
      status: error instanceof Error && error.message.includes('必須') ? 400 : 500,
      headers 
    });
  }
}