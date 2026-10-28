# 06 — Hashing

| | Hashing | Encryption |
|---|---|---|
| اتجاه | واحد (مينفعش يرجع) | اتنين (encrypt/decrypt) |
| الاستخدام | الباسورد | بيانات محتاج ترجعها (موبايل) |
| المكتبة | `bcrypt` | `crypto` (AES-256-CBC) |

- التسجيل: `bcrypt.hashSync(password, 10)`
- تسجيل الدخول: `compareSync(password, user.password)`
- تغيير الباسورد: مقارنة القديم ثم hash للجديد

(توليد التوكن بعد تسجيل الدخول في فولدر 11.)
