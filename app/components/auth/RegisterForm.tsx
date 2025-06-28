import { useState } from 'react';
import { useAuth } from './AuthContext';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // パスワード確認
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register(email, name, password);
      
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || 'ユーザー登録に失敗しました');
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
            ユーザー登録
          </h2>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            名前
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="山田太郎"
          />
        </div>

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

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード（確認）
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="パスワードを再入力"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '登録中...' : 'アカウント作成'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            既にアカウントをお持ちの方はこちら
          </button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          アカウントを作成することで、
          <a href="/terms" className="text-blue-500 hover:underline">利用規約</a>
          および
          <a href="/privacy" className="text-blue-500 hover:underline">プライバシーポリシー</a>
          に同意したものとみなされます。
        </div>
      </form>
    </div>
  );
}