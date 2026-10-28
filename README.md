# Saraha App

Node.js + Express + MongoDB (Mongoose) anonymous-messaging API.

## Run
```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```
The server refuses to start if a required env variable is missing or the DB is unreachable.

## Structure
```
index.js
src/
  Common/      enums + custom error classes + global error handler
  DB/          connection, Models, Repositories (repository pattern)
  Middleware/  authentication, authorization, validation, rate-limit, multer
  Modules/     User, Messages (controller + services)
  Utils/       tokens (JWT), encryption (AES-256-GCM), send-email, cloudinary, files, env
  Validators/  Joi schemas
docs/          notes for each task (01 → 15)
postman/       collection + global variables
uploads/       locally stored profile pictures
```

## Endpoints
`/api/users`
- Auth: `register`, `Confirm`, `resend-confirmation`, `login`, `login/verify-2step`, `refresh-token`, `Logout`, `signup-gmail`
- Password recovery: `POST forgot-password`, `PUT reset-password`
- Two-step verification: `POST enable-2step`, `PUT confirm-2step`, `POST disable-2step`
- Account: `GET profile`, `PUT update`, `PUT update-password`, `DELETE delete`
- Uploads: `PUT profile-picture/local`, `PUT profile-picture/cloudinary`
- Admin: `GET list`

`/api/messages`
- `POST send/:receiverId` (public, anonymous) · `GET /` (mine, paginated) · `DELETE /:messageId`

`GET /health`

Protected routes use `Authorization: Bearer <accessToken>`.
Postman: import both files from `postman/` (see `docs/14-Postman-Global-Variables.md`).
