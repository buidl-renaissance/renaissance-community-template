import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById } from '@/db/user';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

type UploadResponseData = {
  success: boolean;
  url: string;
};

type ErrorResponse = {
  error: string;
};

// Helper to get user from request
async function getUserFromRequest(req: NextApiRequest) {
  if (req.query.userId && typeof req.query.userId === 'string') {
    return await getUserById(req.query.userId);
  }

  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/user_session=([^;]+)/);
  
  if (sessionMatch && sessionMatch[1]) {
    return await getUserById(sessionMatch[1]);
  }

  return null;
}

// Config for Next.js API route to handle larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponseData | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { image, type = 'general' } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Validate base64 image
    const matches = image.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format. Must be base64 encoded PNG, JPEG, GIF, or WebP.' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Check file size (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large. Maximum size is 5MB.' });
    }

    // Generate unique filename
    const ext = mimeType === 'jpeg' ? 'jpg' : mimeType;
    const filename = `${uuidv4()}.${ext}`;
    const subfolder = type === 'avatar' ? 'avatars' : type === 'event' ? 'events' : 'posts';

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Return URL
    const url = `/uploads/${subfolder}/${filename}`;

    return res.status(200).json({
      success: true,
      url,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
}
