import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../Common/Errors/index.js";

let configured = false;
const configure = () => {
    if (configured) return;
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new AppError("Cloud storage is not configured", 503);
    }
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true
    });
    configured = true;
};

export const uploadBufferToCloudinary = (buffer, folder = "saraha/profile") => {
    configure();
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ folder, resource_type: "image" }, (error, result) =>
                error ? reject(error) : resolve(result))
            .end(buffer);
    });
};

export const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;
    configure();
    await cloudinary.uploader.destroy(publicId).catch(() => {});
};
