import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxdstoooh',
    api_key: process.env.CLOUDINARY_API_KEY || '762437692592244',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'PZIMzpiLdYLJymMV1kdvO1VABNM',
});

export default cloudinary;
