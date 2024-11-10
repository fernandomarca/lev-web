import { getAudioFiles } from '@/utils/files';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'node:fs';


// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   try {
//     const audioFiles = getAudioFiles("public/temp/uploads").map(file => `/temp/uploads/${path.basename(file)}`);
//     return res.status(200).json({ files: audioFiles });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: 'Failed to read directory' });
//   }
// }

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   try {
//     const audioFiles = getAudioFiles("public").map(file => `/${path.basename(file)}`);
//     return res.status(200).json({ files: audioFiles });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: 'Failed to read directory' });
//   }
// }

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const directoryPath = path.join(process.cwd(), 'src', 'uploads');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to scan directory' });
    }
    const audioFiles = files.filter(file => file.endsWith('.mp3'));
    res.status(200).json({ files: audioFiles });
  });
}