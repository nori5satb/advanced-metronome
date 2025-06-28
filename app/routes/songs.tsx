import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from 'react-router';
import { SongRepository } from '../lib/songs';
import { createDB } from '../lib/db';
import SongManagementPage from '../components/song/SongManagementPage';

export async function loader({ context }: LoaderFunctionArgs) {
  const db = createDB(context.cloudflare.env.DB);
  const songRepo = new SongRepository(db);

  try {
    const songs = await songRepo.getAllSongs();
    return { songs };
  } catch (error) {
    console.error('楽曲一覧の取得に失敗:', error);
    return { songs: [] };
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = createDB(context.cloudflare.env.DB);
  const songRepo = new SongRepository(db);

  const formData = await request.formData();
  const action = formData.get('action');

  if (action === 'bulkUpdateTempo') {
    try {
      const updatesJson = formData.get('updates');
      if (typeof updatesJson !== 'string') {
        throw new Error('更新データが不正です');
      }

      const updates: Array<{ sectionId: string; tempo: number }> = JSON.parse(updatesJson);
      
      // テンポの値を検証
      for (const update of updates) {
        if (update.tempo < 30 || update.tempo > 300) {
          throw new Error(`無効なテンポ値: ${update.tempo} BPM (30-300の範囲で指定してください)`);
        }
      }

      await songRepo.bulkUpdateSectionTempo(updates);
      
      return { 
        success: true, 
        message: `${updates.length}個のセクションのテンポを更新しました` 
      };
    } catch (error) {
      console.error('一括テンポ更新エラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '一括テンポ更新に失敗しました' 
      };
    }
  }

  return { success: false, error: '不正なアクションです' };
}

interface SongsPageProps {
  loaderData: {
    songs: Awaited<ReturnType<SongRepository['getAllSongs']>>;
  };
  actionData?: {
    success: boolean;
    message?: string;
    error?: string;
  };
}

export default function SongsPage({ loaderData, actionData }: SongsPageProps) {
  const { songs } = loaderData;

  const handleUpdateSections = async (updates: Array<{ sectionId: string; tempo: number }>): Promise<void> => {
    const formData = new FormData();
    formData.append('action', 'bulkUpdateTempo');
    formData.append('updates', JSON.stringify(updates));

    const response = await fetch('/songs', {
      method: 'POST',
      body: formData
    });

    const result = await response.json() as { success: boolean; error?: string; message?: string };
    
    if (!result.success) {
      throw new Error(result.error || 'テンポ更新に失敗しました');
    }
  };

  return (
    <>
      {/* アクション結果の表示 */}
      {actionData && (
        <div className={`fixed top-4 right-4 p-4 rounded shadow-lg z-50 ${
          actionData.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {actionData.success ? actionData.message : actionData.error}
        </div>
      )}
      
      <SongManagementPage
        songs={songs}
        onUpdateSections={handleUpdateSections}
      />
    </>
  );
}