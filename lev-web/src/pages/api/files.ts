import { getAudioFiles } from '@/utils/files';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const audioFiles = getAudioFiles("public/temp/uploads").map(file => `temp/uploads/${path.basename(file)}`);
    return res.status(200).json({ files: audioFiles });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to read directory' });
  }
}