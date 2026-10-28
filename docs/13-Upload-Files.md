# 13 — Upload Files [local - cloudinary]

Endpoints (form-data, field name: `image`, JPEG/PNG/WEBP, max 2MB):

| Endpoint | Storage |
|---|---|
| `PUT /api/users/profile-picture/local` | على الديسك في `uploads/profile/` وبتتقدم من `/uploads/...` |
| `PUT /api/users/profile-picture/cloudinary` | بتترفع على Cloudinary (من الميموري، من غير ما تتحفظ على السيرفر) |

- `multer.middleware.js` — `localUpload` (diskStorage) و `cloudUpload` (memoryStorage) + `fileFilter` + حد الحجم.
- اسم الملف عشوائي (uuid) والامتداد بييجي من الـ mimetype مش من اسم الملف اللي العميل بعته.
- الصورة القديمة بتتمسح (local أو Cloudinary) لما ترفع جديدة أو تمسح الأكاونت.
- متغيرات Cloudinary في `.env`: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
