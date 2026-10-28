const REQUIRED = [
  "DB_URL_LOCAL", "ENCRYPTION_SECRET_KEY",
  "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET",
  "USER_EMAIL", "USER_PASSWORD", "WEB_CLIENT_ID"
];

// Fail fast on boot instead of crashing later in the middle of a request.
export const validateEnv = () => {
  const missing = REQUIRED.filter((k) => !process.env[k] || process.env[k].startsWith("<"));
  if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
};
