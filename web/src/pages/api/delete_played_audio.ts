import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // deletar arquivo da pasta public/temp/uploads
    const file_name = req.body.file_name;
    console.log(file_name);
    if (file_name === '/temp/silence.mp3') {
      res.status(405).end();
      return;
    }
    const file_path = path.join(process.cwd(), 'public', file_name);
    fs.unlink(file_path, (err) => {
      if (err) {
        console.error(err);
        res.status(500).end();
      }
    });
    res.send('File deleted');
  } else {
    res.status(405).end();
  }
}