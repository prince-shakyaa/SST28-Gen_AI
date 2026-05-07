import type { NextApiRequest, NextApiResponse } from 'next';
import { queryDocument } from '../../lib/rag';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'No query' });

  try {
    const answer = await queryDocument(query);
    res.status(200).json({ answer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
