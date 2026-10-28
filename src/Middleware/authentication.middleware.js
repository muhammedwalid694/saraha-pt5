import blackListedTokensRepository from "../DB/Repositories/black-listed-tokens.repository.js"
import userRepository from "../DB/Repositories/user.repository.js"
import { verifyToken } from "../Utils/tokens.utils.js"
import { UnauthorizedError } from "../Common/Errors/index.js"

// Accepts `Authorization: Bearer <token>` (prefix from JWT_PREFIX) and, for
// backward compatibility, the older `accesstoken: <token>` header.
const extractToken = (req) => {
    const { authorization, accesstoken } = req.headers
    if (authorization) {
        const [prefix, token] = authorization.split(" ")
        if (prefix === (process.env.JWT_PREFIX || "Bearer") && token) return token
    }
    return accesstoken
}

export const authenticationMiddleware = async (req, res, next) => {
    const token = extractToken(req)
    if (!token) throw new UnauthorizedError("Please provide an access token")

    const decodedData = verifyToken(token, process.env.JWT_ACCESS_SECRET)
    if (!decodedData?.jti) throw new UnauthorizedError("Invalid token")

    const blackListedToken = await blackListedTokensRepository.findByTokenId(decodedData.jti)
    if (blackListedToken) throw new UnauthorizedError("Token is blacklisted")

    const user = await userRepository.findById(decodedData._id).select("-password").lean()
    if (!user) throw new UnauthorizedError("User no longer exists")

    // Password changed after this token was issued -> force a new login.
    if (user.credentialsChangedAt &&
        decodedData.iat < Math.floor(user.credentialsChangedAt.getTime() / 1000)) {
        throw new UnauthorizedError("Credentials changed, please log in again")
    }

    req.loggedInUser = { user, token: { tokenId: decodedData.jti, expirationDate: decodedData.exp } }
    next()
}
