import { createDB } from "../lib/db";
import { SongRepository } from "../lib/songs";
import { data } from "react-router";

export async function loader({ params, context }: any) {
  const db = createDB(context.cloudflare.env.DB);
  const songRepo = new SongRepository(db);
  
  const song = await songRepo.getSongById(params.songId);
  if (!song) {
    return data({ error: "楽曲が見つかりません" }, { status: 404 });
  }
  
  return data(song);
}

export async function action({ request, params, context }: any) {
  const db = createDB(context.cloudflare.env.DB);
  const songRepo = new SongRepository(db);
  
  const formData = await request.formData();
  const method = formData.get("_method") as string;
  
  switch (method) {
    case "PUT": {
      const title = formData.get("title") as string;
      const artist = formData.get("artist") as string;
      const genre = formData.get("genre") as string;
      const defaultTempo = parseInt(formData.get("defaultTempo") as string) || undefined;
      const defaultTimeSignature = formData.get("defaultTimeSignature") as string;
      
      const updates: any = {};
      if (title) updates.title = title;
      if (artist) updates.artist = artist;
      if (genre) updates.genre = genre;
      if (defaultTempo) updates.defaultTempo = defaultTempo;
      if (defaultTimeSignature) updates.defaultTimeSignature = defaultTimeSignature;
      
      const song = await songRepo.updateSong(params.songId, updates);
      if (!song) {
        return data({ error: "楽曲が見つかりません" }, { status: 404 });
      }
      
      return data(song);
    }
    
    case "DELETE": {
      await songRepo.deleteSong(params.songId);
      return data({ success: true });
    }
    
    default:
      return data({ error: "メソッドが対応していません" }, { status: 405 });
  }
}