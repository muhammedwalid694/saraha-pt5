# 08 — Environment variables

- كل الأسرار (DB URL, JWT secrets, SMTP password, encryption key, Google client id) في `.env` ومش في الكود.
- `.env` في `.gitignore`، و`.env.example` هو القالب اللي بيتشارك.
- `import "dotenv/config"` لازم يكون **أول import** في `index.js` لأن ملفات زي `encryption.utlis.js` بتقرأ `process.env` وقت الـ import.
- `cross-env NODE_ENV=dev` في الـ scripts.

> قيم `.env.example` فاضية عمدًا. الـ `.env` الأصلي فيه باسوردات حقيقية (MongoDB + Gmail) فمنسختهاش.
> لو الباسوردات دي اتشاركت قبل كده، الأفضل تغيّرها.
