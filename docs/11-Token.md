# 11 — Token (JWT)

- `tokens.utils.js` — `generateToken` / `verifyToken` + `generateAuthTokens(user)` (access + refresh in one call)
- **Access token** (`JWT_ACCESS_EXPIRES_IN`, default 1h) + **Refresh token** (`JWT_REFRESH_EXPIRES_IN`, default 30d)، كل واحد بـ secret مختلف، وكل توكن له `jti` (uuid).
- `SignInService` — يطلّع الاتنين بعد تسجيل الدخول (بشرط إن الإيميل متأكد)
- `RefreshTokenService` — يطلّع access token جديد من الـ refresh token (header: `refreshtoken`)، ويتأكد إنه مش في الـ blacklist واليوزر لسه موجود
- `authenticationMiddleware` — يقرأ `Authorization: Bearer <token>` (أو header `accesstoken` القديم)، يتحقق، يتأكد إنه مش في الـ blacklist، ويجيب اليوزر
- `LogoutService` — يحط الـ `jti` (وكمان الـ refresh token لو اتبعت) في الـ blacklist. الـ blacklist فيها TTL index فبتتنضف لوحدها.
- تغيير الباسورد بيحط `credentialsChangedAt` فكل التوكنز القديمة بتتلغي.
- `SignUpServiceGmail` — تسجيل/دخول بـ Google idToken ثم توكنات التطبيق
- `authorizationMiddleware` — صلاحيات حسب الـ role (403 لو مش مسموح)
