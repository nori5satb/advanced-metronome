import { useState } from 'react';
import { useAuth } from './AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || 'ログインに失敗しました');
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
            ログイン
          </h2>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="8文字以上"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            アカウントをお持ちでない方はこちら
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-600 text-sm"
            onClick={() => {
              // パスワードリセット機能は将来実装
              alert('パスワードリセット機能は実装予定です');
            }}
          >
            パスワードを忘れた方
          </button>
        </div>
      </form>
    </div>
  );
}