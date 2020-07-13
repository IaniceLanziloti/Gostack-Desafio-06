import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

const destination = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  destination,
  storage: multer.diskStorage({
    destination,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('hex');
      const filename = `${fileHash}-${file.originalname}`;
      return callback(null, filename);
    },
  }),
};
