import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const dynamic = "force-dynamic";

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  if (req.method === 'POST') {
    const uploadDir = path.join(process.cwd(), 'public');
    // const uploadDir = path.join(process.cwd(), 'public', 'temp', 'uploads');
    const form = formidable({
      uploadDir,
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(500).json({ message: 'Error parsing the files' });
      }

      const file = files.audio;
      if (!file) {
        return res.status(400).json({ message: 'No audio file uploaded' });
      }

      const oldPath = file[0].filepath;
      const originalFilename = file[0].originalFilename || `audio-${Date.now()}`;
      const parsedFilename = path.parse(originalFilename).name;
      const filename = `${parsedFilename}-${Date.now()}.mp3`;
      const newPath = path.join(uploadDir, filename);

      fs.rename(oldPath, newPath, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error saving the file' });
        }

        res.status(200).json({ message: 'File uploaded successfully', path: newPath });
      });
    });
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method not allowed' });
  }
};

export default handler;