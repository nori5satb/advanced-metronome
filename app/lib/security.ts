/**
 * セキュリティ関連のユーティリティ
 */

// データサニタイゼーション
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // HTMLタグの除去
    .replace(/['"]/g, '') // クォートの除去
    .trim()
    .slice(0, 1000); // 最大長制限
}

// 数値バリデーション
export function validateNumber(value: any, min: number, max: number): number {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    throw new Error(`Invalid number: must be between ${min} and ${max}`);
  }
  return num;
}

// UUIDバリデーション
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// SQLインジェクション対策のためのエスケープ
export function escapeSqlString(input: string): string {
  return input.replace(/'/g, "''");
}

// 楽曲データのバリデーション
export interface ValidatedSongData {
  title: string;
  artist?: string;
  genre?: string;
  defaultTempo?: number;
  defaultTimeSignature?: string;
}

export function validateSongData(data: any): ValidatedSongData {
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('楽曲タイトルは必須です');
  }

  const validated: ValidatedSongData = {
    title: sanitizeString(data.title),
  };

  if (data.artist) {
    validated.artist = sanitizeString(data.artist);
  }

  if (data.genre) {
    validated.genre = sanitizeString(data.genre);
  }

  if (data.defaultTempo) {
    validated.defaultTempo = validateNumber(data.defaultTempo, 30, 300);
  }

  if (data.defaultTimeSignature) {
    const validSignatures = ['2/4', '3/4', '4/4', '5/4', '6/4', '7/4', '6/8', '7/8', '9/8', '12/8'];
    if (!validSignatures.includes(data.defaultTimeSignature)) {
      throw new Error('無効な拍子記号です');
    }
    validated.defaultTimeSignature = data.defaultTimeSignature;
  }

  return validated;
}

// セクションデータのバリデーション
export interface ValidatedSectionData {
  name: string;
  tempo: number;
  timeSignature: string;
  measures: number;
  order: number;
}

export function validateSectionData(data: any): ValidatedSectionData {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('セクション名は必須です');
  }

  const validated: ValidatedSectionData = {
    name: sanitizeString(data.name),
    tempo: validateNumber(data.tempo, 30, 300),
    timeSignature: data.timeSignature,
    measures: validateNumber(data.measures, 1, 999),
    order: validateNumber(data.order, 1, 999),
  };

  const validSignatures = ['2/4', '3/4', '4/4', '5/4', '6/4', '7/4', '6/8', '7/8', '9/8', '12/8'];
  if (!validSignatures.includes(validated.timeSignature)) {
    throw new Error('無効な拍子記号です');
  }

  return validated;
}

// レート制限チェック
const requestCounts = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(ip: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now - record.timestamp > windowMs) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// CORS設定
export function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    'http://localhost:5174',
    'http://localhost:3000',
    'https://your-domain.com' // 本番環境のドメインに変更
  ];

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

// セキュリティヘッダー
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'microphone=(), camera=(), geolocation=()',
  };
}