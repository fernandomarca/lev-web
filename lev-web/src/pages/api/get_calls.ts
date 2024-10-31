import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const result = await prisma.call.findMany({})
    res.status(200).json({ calls: result });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}