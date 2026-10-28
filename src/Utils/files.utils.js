import fs from "node:fs/promises";
import path from "node:path";

export const UPLOADS_DIR = path.resolve("uploads");
export const PROFILE_DIR = path.join(UPLOADS_DIR, "profile");

// Deletes a locally stored file. Only paths inside /uploads are ever touched.
export const removeLocalFile = async (relativeUrl) => {
    if (!relativeUrl) return;
    const target = path.resolve(path.join(".", relativeUrl));
    if (!target.startsWith(UPLOADS_DIR + path.sep)) return;
    await fs.unlink(target).catch(() => {});
};
