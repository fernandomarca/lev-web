import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { attendant_name, attendant_peer_id, client_name } = req.body;
    const result = await prisma.call.create({
      data: {
        attendant_name,
        attendant_peer_id,
        client_name
      }
    })
    res.status(200).json({ call_id: result.id });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}