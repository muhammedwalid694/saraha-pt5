# 15 — Two-step verification, Max login attempts, Resend email, Forgot & reset password

كل الأكواد (OTP) بتتعمل في `Modules/User/Services/otp.service.js`:
- كود من 6 أرقام، بيتخزن **bcrypt hash** مش plain، صلاحيته 10 دقايق.
- لكل غرض كود لوحده جوه `user.otps`: `confirmation` · `resetPassword` · `login` · `enableTwoStep`.
- **Resend**: كود جديد بيستبدل القديم، بس مرة كل 60 ثانية (وإلا 429).
- **Max OTP attempts**: 5 تخمينات غلط (atomic `$inc`) والكود بيتحرق ولازم تطلب واحد جديد.

## Max login attempts
`POST /api/users/login`
- كل باسورد غلط بيزوّد `loginAttempts`، والرد بيقول فاضل كام محاولة.
- عند `MAX_LOGIN_ATTEMPTS` (5) الأكاونت بيتقفل `LOCK_TIME_MINUTES` (15) → **429** وإيميل تنبيه لصاحب الأكاونت.
- القفل بيتشيك **قبل** مقارنة الباسورد (عشان مينفعش تخمّن وهو مقفول).
- الباسورد الصح أو reset password ناجح بيصفّر العداد.

## Two-step verification
1. `POST /enable-2step` (Bearer) → بيبعت كود على الإيميل
2. `PUT /confirm-2step` `{ otp }` → `twoStepEnabled = true`
3. بعد كده `POST /login` بيرجع `{ twoStepRequired: true }` من غير توكنز ويبعت كود
4. `POST /login/verify-2step` `{ email, otp }` → التوكنز
   (تعمل login تاني = resend للكود، برضه بحد 60 ثانية)
5. `POST /disable-2step` `{ password }` (Bearer) → بيقفلها

> للأكاونتات اللي local بس (حسابات Google ليها تحقق Google الخاص بيها).

## Resend email
`POST /resend-confirmation` `{ email }` — نفس الرد سواء الأكاونت موجود أو لأ (مفيش user enumeration).

## Forgot & reset password
1. `POST /forgot-password` `{ email }` → بيبعت كود (نفس الرد دايمًا)
2. `PUT /reset-password` `{ email, otp, newPassword, confirmNewPassword }`
   - بيحدّث الباسورد، `credentialsChangedAt = now` فكل التوكنز القديمة بتتلغي، بيفك القفل، ويبعت إيميل "تم تغيير الباسورد".

## ملاحظة على rate limit
`authLimiter` على كل routes الـ auth. في الـ dev الحد 100 (عشان تعرف تجرب الـ flow في Postman)، وفي production 10. تغيّره من `AUTH_RATE_LIMIT_MAX`.
