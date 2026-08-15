import { supabase } from './supabase';

const LOGOS_BUCKET = process.env.REACT_APP_SUPABASE_LOGOS_BUCKET || 'logos';

export const uploadLogoFile = async (file: File, folder: 'teams' | 'tournaments'): Promise<string> => {
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'png';
  const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabase.storage.from(LOGOS_BUCKET).upload(filePath, file, { upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};
