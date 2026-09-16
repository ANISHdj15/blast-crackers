const path = require('path');
const fs = require('fs');

/**
 * Universal Storage Service
 * Supports:
 * 1. Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
 * 2. Supabase Storage (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY / SUPABASE_KEY)
 * 3. Local filesystem fallback (/uploads/...)
 */
class StorageService {
  constructor() {
    this.initCloudinary();
  }

  initCloudinary() {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        });
        this.cloudinary = cloudinary;
      } catch (err) {
        console.warn('Cloudinary initialization warning:', err.message);
      }
    }
  }

  /**
   * Upload an image buffer
   * @param {Object} file - Multer file object ({ buffer, originalname, mimetype })
   * @returns {Promise<{ url: string, provider: string }>}
   */
  async uploadImage(file) {
    if (!file || !file.buffer) {
      throw new Error('No file buffer provided for upload');
    }

    // 1. Cloudinary
    if (this.cloudinary) {
      return new Promise((resolve, reject) => {
        const uploadStream = this.cloudinary.uploader.upload_stream(
          {
            folder: 'blast_crackers/products',
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              return reject(error);
            }
            resolve({
              url: result.secure_url,
              provider: 'cloudinary',
              publicId: result.public_id
            });
          }
        );
        uploadStream.end(file.buffer);
      });
    }

    // 2. Supabase Storage (REST API)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'blast_crackers';
        const sanitizedName = `${Date.now()}_${path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${sanitizedName}`;

        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': file.mimetype || 'image/jpeg',
            'x-upsert': 'true'
          },
          body: file.buffer
        });

        if (res.ok) {
          const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${sanitizedName}`;
          return {
            url: publicUrl,
            provider: 'supabase',
            filename: sanitizedName
          };
        } else {
          const errText = await res.text();
          console.warn('Supabase storage upload returned status:', res.status, errText);
        }
      } catch (sbErr) {
        console.warn('Supabase storage upload error:', sbErr.message);
      }
    }

    // 3. Local filesystem fallback
    const uploadDir = path.resolve(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const sanitizedName = `${Date.now()}-${path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, sanitizedName);
    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `/uploads/${sanitizedName}`,
      provider: 'local',
      filename: sanitizedName
    };
  }
}

module.exports = new StorageService();
