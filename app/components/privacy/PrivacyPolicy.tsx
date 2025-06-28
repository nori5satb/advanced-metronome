/**
 * プライバシーポリシーコンポーネント
 */

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">プライバシーポリシー</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. 基本方針</h2>
          <p className="text-gray-700 leading-relaxed">
            当アプリケーションは、ユーザーのプライバシーを最重要視し、個人情報の保護に努めます。
            収集する情報は必要最小限に留め、適切な方法で管理・保護いたします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. 収集する情報</h2>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">必須情報（最小限）</h3>
            <ul className="list-disc list-inside text-blue-700">
              <li>ユーザーアカウント情報（ユーザー名、メールアドレス）</li>
              <li>楽曲・セクションデータ（タイトル、テンポ、拍子等）</li>
              <li>練習履歴データ（練習時間、テンポ変更履歴等）</li>
            </ul>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-2">自動収集情報</h3>
            <ul className="list-disc list-inside text-gray-700">
              <li>アプリケーション使用状況（エラーログ、パフォーマンス情報）</li>
              <li>デバイス情報（ブラウザタイプ、OS、画面サイズ）</li>
              <li>IPアドレス（セキュリティ目的、地域判定は行わない）</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. 情報の利用目的</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>アプリケーションの基本機能提供（メトロノーム、練習管理）</li>
            <li>ユーザーアカウント管理とデータ同期</li>
            <li>サービス改善とバグ修正</li>
            <li>セキュリティ維持とスパム防止</li>
          </ul>
          <div className="bg-red-50 p-4 rounded-lg mt-4">
            <p className="text-red-700 font-medium">
              ❌ 広告配信、マーケティング、第三者への販売は一切行いません
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. データ保護措置</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-green-800 mb-2">技術的保護</h3>
              <ul className="list-disc list-inside text-green-700 text-sm">
                <li>データベース暗号化</li>
                <li>HTTPS通信の強制</li>
                <li>セキュリティヘッダーの実装</li>
                <li>レート制限とスパム防止</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-purple-800 mb-2">運用面の保護</h3>
              <ul className="list-disc list-inside text-purple-700 text-sm">
                <li>アクセス権限の最小化</li>
                <li>定期的なセキュリティ監査</li>
                <li>インシデント対応手順</li>
                <li>データバックアップとリカバリ</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. ユーザーの権利</h2>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">データ制御権</h3>
            <ul className="list-disc list-inside text-yellow-700 space-y-1">
              <li><strong>閲覧権</strong>：保存されているデータの確認</li>
              <li><strong>修正権</strong>：不正確なデータの修正</li>
              <li><strong>削除権</strong>：アカウントとデータの完全削除</li>
              <li><strong>エクスポート権</strong>：データのダウンロード</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. データ保存期間</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">データ種類</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">保存期間</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">理由</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">楽曲・練習データ</td>
                  <td className="border border-gray-300 px-4 py-2">アカウント有効期間中</td>
                  <td className="border border-gray-300 px-4 py-2">サービス提供のため</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">ログデータ</td>
                  <td className="border border-gray-300 px-4 py-2">30日間</td>
                  <td className="border border-gray-300 px-4 py-2">トラブルシューティング</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">削除されたアカウント</td>
                  <td className="border border-gray-300 px-4 py-2">即座に削除</td>
                  <td className="border border-gray-300 px-4 py-2">プライバシー保護</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Cookie・ローカルストレージ</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            当アプリケーションは、ユーザー体験向上のために以下の情報をローカルに保存します：
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>ログイン状態の維持（セッションクッキー）</li>
            <li>アプリケーション設定（メトロノーム設定等）</li>
            <li>一時的なキャッシュデータ</li>
          </ul>
          <p className="text-sm text-gray-600 mt-4">
            ※ 追跡クッキーや広告目的のクッキーは使用しません
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. 第三者との情報共有</h2>
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-800 font-medium">
              原則として、ユーザーの個人情報を第三者と共有することはありません。
            </p>
            <div className="mt-4">
              <p className="text-red-700 font-medium mb-2">例外的な場合：</p>
              <ul className="list-disc list-inside text-red-700 text-sm">
                <li>法的要請がある場合（令状、裁判所命令等）</li>
                <li>ユーザーの生命・安全に関わる緊急事態</li>
                <li>サービス提供に必要な技術的処理（暗号化された形式のみ）</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. お問い合わせ</h2>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800">
              プライバシーに関するご質問、データの修正・削除のご依頼は、
              アプリケーション内の設定ページまたは以下までご連絡ください：
            </p>
            <p className="text-blue-700 font-medium mt-2">
              📧 privacy@your-domain.com
            </p>
            <p className="text-blue-600 text-sm mt-2">
              ※ ご依頼から30日以内に対応いたします
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. ポリシーの更新</h2>
          <p className="text-gray-700 leading-relaxed">
            本プライバシーポリシーは、法令の変更やサービス改善に応じて更新される場合があります。
            重要な変更がある場合は、アプリケーション内で事前にお知らせいたします。
          </p>
          <div className="bg-gray-100 p-3 rounded text-sm text-gray-600 mt-4">
            <p><strong>最終更新日：</strong> 2025年6月28日</p>
            <p><strong>バージョン：</strong> 1.0</p>
          </div>
        </section>
      </div>
    </div>
  );
}