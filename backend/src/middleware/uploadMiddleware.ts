// backend/src/middleware/uploadMiddleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, safe);
  },
});

// Allowed MIME lists
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// fileFilter: choose allowed types based on request path (route)
function fileFilter(req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const url = (req.originalUrl || req.url || '').toLowerCase();
  const field = (file.fieldname || '').toLowerCase();

  // Avatar uploads: /users/me/profile/avatar
  if (url.includes('/users/me/profile/avatar') || url.includes('/profile/avatar')) {
    if (IMAGE_MIMES.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only image files (jpg/png/webp/gif) are allowed for avatar uploads.'));
  }

  // Resume / application uploads: resume or apply-file endpoints
  if (
    url.includes('/users/me/profile/resume') ||
    url.includes('/apply-file') ||
    url.includes('/jobs/') && url.includes('/apply-file') ||
    field.includes('resume') ||
    field.includes('file') // fallback for routes that use 'file' field for resume
  ) {
    if (DOC_MIMES.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only PDF / DOC / DOCX files are allowed for resumes.'));
  }

  // Default: allow common types (images + docs)
  if (IMAGE_MIMES.includes(file.mimetype) || DOC_MIMES.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(new Error('Unsupported file type.'));
}

// reasonable limits (10MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;
