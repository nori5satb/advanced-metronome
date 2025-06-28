import { eq, and } from "drizzle-orm";
import { users, userSessions, passwordResetTokens, emailVerificationTokens } from "../../database/schema";
import type { DB } from "./db";
import crypto from "crypto";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: UserSession;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export class AuthService {
  constructor(private db: DB) {}

  /**
   * パスワードのハッシュ化
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * パスワードの検証
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(password);
    return hashedPassword === hash;
  }

  /**
   * セキュアなトークン生成
   */
  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * セッショントークン生成
   */
  private generateSessionToken(): string {
    return this.generateSecureToken();
  }

  /**
   * ユーザー登録
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      // メールアドレスの重複チェック
      const existingUser = await this.db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existingUser.length > 0) {
        return {
          success: false,
          error: 'このメールアドレスは既に使用されています'
        };
      }

      // パスワードの検証
      if (data.password.length < 8) {
        return {
          success: false,
          error: 'パスワードは8文字以上で入力してください'
        };
      }

      // パスワードのハッシュ化
      const passwordHash = await this.hashPassword(data.password);

      // ユーザー作成
      const userId = crypto.randomUUID();
      const now = Date.now();

      const newUser: NewUser = {
        id: userId,
        email: data.email,
        name: data.name,
        passwordHash,
        emailVerified: 0,
        isActive: 1,
        createdAt: now,
        updatedAt: now
      };

      await this.db.insert(users).values(newUser);

      // 作成されたユーザーを取得
      const user = await this.getUserById(userId);
      
      if (!user) {
        return {
          success: false,
          error: 'ユーザー作成に失敗しました'
        };
      }

      // セッション作成
      const session = await this.createSession(userId);

      return {
        success: true,
        user,
        session
      };
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      return {
        success: false,
        error: 'ユーザー登録に失敗しました'
      };
    }
  }

  /**
   * ログイン
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // ユーザー検索
      const userResult = await this.db
        .select()
        .from(users)
        .where(and(
          eq(users.email, credentials.email),
          eq(users.isActive, 1)
        ))
        .limit(1);

      if (userResult.length === 0) {
        return {
          success: false,
          error: 'メールアドレスまたはパスワードが正しくありません'
        };
      }

      const user = userResult[0];

      // パスワード検証
      if (!user.passwordHash) {
        return {
          success: false,
          error: 'このアカウントではパスワードログインできません'
        };
      }

      const isValidPassword = await this.verifyPassword(credentials.password, user.passwordHash);
      
      if (!isValidPassword) {
        return {
          success: false,
          error: 'メールアドレスまたはパスワードが正しくありません'
        };
      }

      // 最終ログイン時刻を更新
      await this.db
        .update(users)
        .set({ 
          lastLoginAt: Date.now(),
          updatedAt: Date.now()
        })
        .where(eq(users.id, user.id));

      // セッション作成
      const session = await this.createSession(user.id);

      return {
        success: true,
        user,
        session
      };
    } catch (error) {
      console.error('ログインエラー:', error);
      return {
        success: false,
        error: 'ログインに失敗しました'
      };
    }
  }

  /**
   * セッション作成
   */
  async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<UserSession> {
    const sessionToken = this.generateSessionToken();
    const now = Date.now();
    const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30日後

    const sessionData: NewUserSession = {
      id: crypto.randomUUID(),
      userId,
      sessionToken,
      expiresAt,
      ipAddress,
      userAgent,
      isActive: 1,
      createdAt: now,
      updatedAt: now
    };

    await this.db.insert(userSessions).values(sessionData);

    const session = await this.db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken))
      .limit(1);

    return session[0];
  }

  /**
   * セッション検証
   */
  async validateSession(sessionToken: string): Promise<{ user: User; session: UserSession } | null> {
    try {
      const sessionResult = await this.db
        .select()
        .from(userSessions)
        .where(and(
          eq(userSessions.sessionToken, sessionToken),
          eq(userSessions.isActive, 1)
        ))
        .limit(1);

      if (sessionResult.length === 0) {
        return null;
      }

      const session = sessionResult[0];

      // セッション有効期限チェック
      if (session.expiresAt < Date.now()) {
        await this.invalidateSession(sessionToken);
        return null;
      }

      // ユーザー取得
      const user = await this.getUserById(session.userId);
      
      if (!user || !user.isActive) {
        return null;
      }

      return { user, session };
    } catch (error) {
      console.error('セッション検証エラー:', error);
      return null;
    }
  }

  /**
   * セッション無効化
   */
  async invalidateSession(sessionToken: string): Promise<void> {
    await this.db
      .update(userSessions)
      .set({ 
        isActive: 0,
        updatedAt: Date.now()
      })
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  /**
   * ログアウト
   */
  async logout(sessionToken: string): Promise<void> {
    await this.invalidateSession(sessionToken);
  }

  /**
   * ユーザーID取得
   */
  async getUserById(id: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * メールアドレスでユーザー取得
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * パスワードリセットトークン生成
   */
  async generatePasswordResetToken(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        // セキュリティのため、ユーザーが存在しない場合でも成功を返す
        return { success: true };
      }

      const token = this.generateSecureToken();
      const expiresAt = Date.now() + (60 * 60 * 1000); // 1時間後

      await this.db.insert(passwordResetTokens).values({
        id: crypto.randomUUID(),
        userId: user.id,
        token,
        expiresAt,
        isUsed: 0,
        createdAt: Date.now()
      });

      // 実際のアプリではここでメール送信処理を行う
      console.log(`パスワードリセットトークン: ${token} (User: ${user.email})`);

      return { success: true };
    } catch (error) {
      console.error('パスワードリセットトークン生成エラー:', error);
      return {
        success: false,
        error: 'パスワードリセットの処理に失敗しました'
      };
    }
  }

  /**
   * パスワードリセット実行
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // トークン検証
      const tokenResult = await this.db
        .select()
        .from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.isUsed, 0)
        ))
        .limit(1);

      if (tokenResult.length === 0) {
        return {
          success: false,
          error: '無効なトークンです'
        };
      }

      const resetToken = tokenResult[0];

      // 有効期限チェック
      if (resetToken.expiresAt < Date.now()) {
        return {
          success: false,
          error: 'トークンの有効期限が切れています'
        };
      }

      // パスワード検証
      if (newPassword.length < 8) {
        return {
          success: false,
          error: 'パスワードは8文字以上で入力してください'
        };
      }

      // パスワードハッシュ化
      const passwordHash = await this.hashPassword(newPassword);

      // パスワード更新
      await this.db
        .update(users)
        .set({ 
          passwordHash,
          updatedAt: Date.now()
        })
        .where(eq(users.id, resetToken.userId));

      // トークンを使用済みにマーク
      await this.db
        .update(passwordResetTokens)
        .set({ isUsed: 1 })
        .where(eq(passwordResetTokens.id, resetToken.id));

      return { success: true };
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      return {
        success: false,
        error: 'パスワードリセットに失敗しました'
      };
    }
  }

  /**
   * ユーザーアカウント削除
   */
  async deleteAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // ユーザーを非アクティブに設定（物理削除ではなく論理削除）
      await this.db
        .update(users)
        .set({ 
          isActive: 0,
          updatedAt: Date.now()
        })
        .where(eq(users.id, userId));

      // 全セッションを無効化
      await this.db
        .update(userSessions)
        .set({ 
          isActive: 0,
          updatedAt: Date.now()
        })
        .where(eq(userSessions.userId, userId));

      return { success: true };
    } catch (error) {
      console.error('アカウント削除エラー:', error);
      return {
        success: false,
        error: 'アカウント削除に失敗しました'
      };
    }
  }
}

// グローバルインスタンス管理
let authServiceInstance: AuthService | null = null;

export function getAuthService(db: DB): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(db);
  }
  return authServiceInstance;
}