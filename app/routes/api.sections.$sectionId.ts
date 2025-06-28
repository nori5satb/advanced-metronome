import { createDB } from "../lib/db";
import { SongRepository } from "../lib/songs";
import { data } from "react-router";

export async function loader({ params, context }: any) {
  const db = createDB(context.cloudflare.env.DB);
  const songRepo = new SongRepository(db);
  
  const section = await songRepo.getSectionById(params.sectionId);
  if (!section) {
    return data({ error: "セクションが見つかりません" }, { status: 404 });
  }
  
  return data(section);
}

export async function action({ request, params, context }: any) {
  const db = createDB(context.cloudflare.env.DB);
  const songRepo = new SongRepository(db);
  
  const formData = await request.formData();
  const method = formData.get("_method") as string;
  
  switch (method) {
    case "PUT": {
      const name = formData.get("name") as string;
      const tempo = parseInt(formData.get("tempo") as string);
      const timeSignature = formData.get("timeSignature") as string;
      const measures = parseInt(formData.get("measures") as string);
      const order = parseInt(formData.get("order") as string);
      
      const updates: any = {};
      if (name) updates.name = name;
      if (tempo) updates.tempo = tempo;
      if (timeSignature) updates.timeSignature = timeSignature;
      if (measures) updates.measures = measures;
      if (order) updates.order = order;
      
      const section = await songRepo.updateSection(params.sectionId, updates);
      if (!section) {
        return data({ error: "セクションが見つかりません" }, { status: 404 });
      }
      
      return data(section);
    }
    
    case "DELETE": {
      await songRepo.deleteSection(params.sectionId);
      return data({ success: true });
    }
    
    default:
      return data({ error: "メソッドが対応していません" }, { status: 405 });
  }
}