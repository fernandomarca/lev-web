import type { NextApiRequest, NextApiResponse } from 'next';

let attendantId: string = '';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({ attendantId });
  } else if (req.method === 'POST') {
    attendantId = req.body.attendantId;
    res.status(200).json({ attendantId });
  } else {
    res.status(405).end();
  }
}