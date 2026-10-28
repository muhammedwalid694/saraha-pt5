# 10 — Error handling classes (Exceptions)

`AppError` (فيه `statusCode` و`isOperational`) وبيرثه:
`BadRequestError 400` · `UnauthorizedError 401` · `ForbiddenError 403` · `NotFoundError 404` · `ConflictError 409` · `ValidationError 422`

```js
if (!user) throw new NotFoundError("User not found");
```
Express 5 بيلقط الـ async errors لوحده، فالـ `throw` بيوصل للـ error handler في `index.js`:
- Operational error → يرجّع رسالته الحقيقية.
- Bug غير متوقع → رسالة عامة بدون تفاصيل داخلية.
