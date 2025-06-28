import { useState } from 'react';
import { useAuth } from './AuthContext';

interface UserProfileProps {
  onClose?: () => void;
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      onClose?.();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">プロフィール</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* ユーザー情報 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名前
          </label>
          <div className="p-3 bg-gray-50 rounded border">
            {user.name}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <div className="p-3 bg-gray-50 rounded border flex items-center justify-between">
            <span>{user.email}</span>
            {user.emailVerified ? (
              <span className="text-green-600 text-sm">✓ 認証済み</span>
            ) : (
              <span className="text-orange-600 text-sm">未認証</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            登録日
          </label>
          <div className="p-3 bg-gray-50 rounded border">
            {formatDate(user.createdAt)}
          </div>
        </div>

        {user.lastLoginAt && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最終ログイン
            </label>
            <div className="p-3 bg-gray-50 rounded border">
              {formatDate(user.lastLoginAt)}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="pt-4 space-y-3">
          <button
            onClick={() => {
              // パスワード変更機能は将来実装
              alert('パスワード変更機能は実装予定です');
            }}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            パスワード変更
          </button>

          <button
            onClick={() => {
              // アカウント削除機能は将来実装
              const confirmed = confirm('本当にアカウントを削除しますか？この操作は取り消せません。');
              if (confirmed) {
                alert('アカウント削除機能は実装予定です');
              }
            }}
            className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            アカウント削除
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>
      </div>
    </div>
  );
}