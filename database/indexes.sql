-- パフォーマンス最適化のためのインデックス

-- 楽曲検索の高速化
CREATE INDEX IF NOT EXISTS idx_songs_user_id ON songs(userId);
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(createdAt);

-- セクション検索の高速化
CREATE INDEX IF NOT EXISTS idx_sections_song_id ON sections(songId);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(songId, order);

-- 練習セッション検索の高速化
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practiceSessions(userId);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_song_id ON practiceSessions(songId);

-- 練習履歴検索の高速化
CREATE INDEX IF NOT EXISTS idx_practice_history_session_id ON practiceHistory(sessionId);
CREATE INDEX IF NOT EXISTS idx_practice_history_song_id ON practiceHistory(songId);
CREATE INDEX IF NOT EXISTS idx_practice_history_date ON practiceHistory(practiceDate);
CREATE INDEX IF NOT EXISTS idx_practice_history_user_date ON practiceHistory(sessionId, practiceDate);

-- ユーザー認証関連の高速化
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON userSessions(userId);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON userSessions(sessionToken);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON userSessions(expiresAt);

-- OAuth認証の高速化
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauthAccounts(userId);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauthAccounts(provider, providerAccountId);

-- パスワードリセット・メール認証の高速化
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON passwordResetTokens(userId);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON passwordResetTokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON emailVerificationTokens(userId);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON emailVerificationTokens(token);

-- データ同期の高速化
CREATE INDEX IF NOT EXISTS idx_sync_data_user_id ON syncData(userId);
CREATE INDEX IF NOT EXISTS idx_sync_data_timestamp ON syncData(timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_data_entity ON syncData(entityType, entityId);
CREATE INDEX IF NOT EXISTS idx_sync_data_processed ON syncData(isProcessed);

-- デバイス登録の高速化
CREATE INDEX IF NOT EXISTS idx_device_registrations_user_id ON deviceRegistrations(userId);
CREATE INDEX IF NOT EXISTS idx_device_registrations_device_id ON deviceRegistrations(deviceId);

-- 同期競合の高速化
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user_id ON syncConflicts(userId);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_entity ON syncConflicts(entityType, entityId);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_resolved ON syncConflicts(isResolved);