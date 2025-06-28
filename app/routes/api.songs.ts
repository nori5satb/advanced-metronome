import { createDB } from "../lib/db";
import { SongRepository } from "../lib/songs";
import { data } from "react-router";

export async function loader({ context }: any) {
  const db = createDB(context.cloudflare.env.DB);
  const songRepo = new SongRepository(db);
  
  const songs = await songRepo.getAllSongs();
  return data(songs);
}

export async function action({ request, context }: any) {
  const db = createDB(context.cloudflare.env.DB);
  const songRepo = new SongRepository(db);
  
  const formData = await request.formData();
  const method = formData.get("_method") as string;
  
  switch (method) {
    case "POST": {
      const title = formData.get("title") as string;
      const artist = formData.get("artist") as string;
      const genre = formData.get("genre") as string;
      const defaultTempo = parseInt(formData.get("defaultTempo") as string) || undefined;
      const defaultTimeSignature = formData.get("defaultTimeSignature") as string;
      
      if (!title) {
        return data({ error: "タイトルは必須です" }, { status: 400 });
      }
      
      const id = crypto.randomUUID();
      const song = await songRepo.createSong({
        id,
        title,
        artist: artist || undefined,
        genre: genre || undefined,
        defaultTempo,
        defaultTimeSignature: defaultTimeSignature || undefined,
      });
      
      return data(song, { status: 201 });
    }
    
    default:
      return data({ error: "メソッドが対応していません" }, { status: 405 });
  }
}