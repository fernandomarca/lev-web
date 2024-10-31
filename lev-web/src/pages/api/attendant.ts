import type { NextApiRequest, NextApiResponse } from 'next';

let clientId: string = '';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({ clientId });
  } else if (req.method === 'POST') {
    clientId = req.body.clientId;
    res.status(200).json({ clientId });
  } else {
    res.status(405).end();
  }
}