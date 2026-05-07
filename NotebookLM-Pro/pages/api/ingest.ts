import type { NextApiRequest, NextApiResponse } from 'next';
import { processDocument } from '../../lib/rag';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = formidable({});
  const [fields, files] = await form.parse(req);
  const file = files.file?.[0];

  if (!file) return res.status(400).json({ error: 'No file' });

  try {
    // Create a mock File object from the formidable file
    const buffer = fs.readFileSync(file.filepath);
    const mockFile = new File([buffer], file.originalFilename || 'document', { type: file.mimetype || 'application/pdf' });
    
    const result = await processDocument(mockFile);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
