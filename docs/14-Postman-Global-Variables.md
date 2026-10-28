# 14 — Postman global variables

الملفات في فولدر `postman/`:
- `saraha-app.postman_collection.json` — كل الـ endpoints
- `saraha-app.postman_globals.json` — الـ globals (`baseUrl`, `email`, `accessToken`, `refreshToken`, `userId`, `messageId`, `otp`, `newPassword`)

الاستخدام: Import الاتنين في Postman (Globals: من زرار Environments ← Globals ← Import).

- **Login / Google** — الـ Test script بيعمل `pm.globals.set` لـ `accessToken` و `refreshToken` و `userId`.
- **Refresh Token** — بيحدّث `accessToken` لوحده.
- **Logout** — بيمسح التوكنز (`pm.globals.unset`).
- **Get My Messages** — بيحفظ أول `messageId` عشان Delete Message.
- الـ Collection كلها Auth = Bearer `{{accessToken}}` فمفيش نسخ ولصق للتوكن.
- **`otp`** — الكود اللي بيوصلك على الإيميل (Confirm / 2-Step / Reset): انسخه في Globals قبل ما تبعت الريكويست.
- **Login - Verify 2-Step** — بيحفظ التوكنز زي Login بالظبط.
