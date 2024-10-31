import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { call_id } = req.query;
    if (!call_id) {
      res.status(400).json({ message: 'Missing call_id' });
    }
    const result = await prisma.call.findUnique({
      where: {
        id: call_id as string
      }
    })
    res.status(200).json({ call: result });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}