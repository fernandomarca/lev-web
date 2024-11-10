import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { file } = req.query;
  const filePath = path.join(process.cwd(), 'src', 'uploads', file as string);

  try {
    const fileBuffer = await fs.readFile(filePath);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(fileBuffer);
  } catch (error) {
    console.error("get audio", error);
    res.status(404).send('File not found');
  }
};