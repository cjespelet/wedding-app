/**
 * Mirror config for non-TS tooling / docs.
 * Runtime code imports `src/config/cloudinary.ts` (compiled to dist/config/cloudinary.js).
 */
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
