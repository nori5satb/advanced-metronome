import { createDB } from "../lib/db";
import { SongRepository } from "../lib/songs";
import { data } from "react-router";

export async function loader({ params, context }: any) {
  const db = createDB(context.cloudflare.env.DB);
  const songRepo = new SongRepository(db);
  
  const sections = await songRepo.getSongSections(params.songId);
  return data(sections);
}

export async function action({ request, params, context }: any) {
  const db = createDB(context.cloudflare.env.DB);
  const songRepo = new SongRepository(db);
  
  const formData = await request.formData();
  const method = formData.get("_method") as string;
  
  switch (method) {
    case "POST": {
      const name = formData.get("name") as string;
      const tempo = parseInt(formData.get("tempo") as string);
      const timeSignature = formData.get("timeSignature") as string;
      const measures = parseInt(formData.get("measures") as string) || 4;
      const order = parseInt(formData.get("order") as string);
      
      if (!name || !tempo || !timeSignature || !order) {
        return data({ error: "必須項目が不足しています" }, { status: 400 });
      }
      
      const id = crypto.randomUUID();
      const section = await songRepo.createSection({
        id,
        songId: params.songId,
        name,
        tempo,
        timeSignature,
        measures,
        order,
      });
      
      return data(section, { status: 201 });
    }
    
    case "PUT": {
      const sectionIds = JSON.parse(formData.get("sectionIds") as string);
      await songRepo.reorderSections(params.songId, sectionIds);
      return data({ success: true });
    }
    
    default:
      return data({ error: "メソッドが対応していません" }, { status: 405 });
  }
}