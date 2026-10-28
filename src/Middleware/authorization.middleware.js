import { ForbiddenError } from "../Common/Errors/index.js";

export const authorizationMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        // req.loggedInUser is shaped as { user, token }, so the role
        // lives on req.loggedInUser.user, not directly on req.loggedInUser.
        const { role } = req.loggedInUser.user;

        if (allowedRoles.includes(role)) {
            return next();
        }

        throw new ForbiddenError("Unauthorized");
    };
};
