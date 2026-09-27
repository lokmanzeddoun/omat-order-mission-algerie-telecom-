import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

export const SUPPORTED_FILES = ['xlsx', 'csv'];
export const MAX_IMPORT_ROWS = 5000;

export const multerOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const ext: string = file.originalname.split('.').pop() || '';
    const type = String(file.mimetype || '').toLowerCase();
    const mimeOk =
      (ext.toLowerCase() === 'xlsx' &&
        type ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
      (ext.toLowerCase() === 'csv' &&
        ['text/csv', 'application/csv', 'text/plain'].includes(type));
    if (SUPPORTED_FILES.includes(ext.toLowerCase()) && mimeOk) {
      cb(null, true);
    } else {
      cb(new BadRequestException(`Unsupported file type ${ext}`), false);
    }
  },
};
