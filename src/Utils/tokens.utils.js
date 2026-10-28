import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

// Generate
export const generateToken = (payload, secret, options) => {
    return jwt.sign(payload, secret, options);
}

// Verify (throws JsonWebTokenError / TokenExpiredError, mapped to 401 by the error handler)
export const verifyToken = (token, secret) => {
    return jwt.verify(token, secret);
}

const payloadOf = (user) => ({ _id: user._id, email: user.email });

export const generateAccessToken = (user) =>
    generateToken(payloadOf(user), process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
        jwtid: randomUUID()
    });

export const generateRefreshToken = (user) =>
    generateToken(payloadOf(user), process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
        jwtid: randomUUID()
    });

export const generateAuthTokens = (user) => ({
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
});
