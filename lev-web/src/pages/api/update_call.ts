import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    const { call_id } = req.query;
    if (!call_id) {
      res.status(400).json({ message: 'Missing call_id' });
    }
    const result = await prisma.call.update({
      where: {
        id: call_id as string
      },
      data: {
        client_peer_id: req.body.client_peer_id
      }
    })
    res.status(200).json({ call: result });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}