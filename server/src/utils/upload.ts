import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

export const SUPPORTED_FILES = ['xlsx', 'sheet'];
export const MAX_IMPORT_ROWS = 5000;

export const multerOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const ext: string = file.originalname.split('.').pop() || '';
    if (SUPPORTED_FILES.indexOf(ext?.toLowerCase()) !== -1) {
      cb(null, true);
    } else {
      cb(new BadRequestException(`Unsupported file type ${ext}`), false);
    }
  },
};
