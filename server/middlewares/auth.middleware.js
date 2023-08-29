import AppError from "../utils/error.util.js";
import jwt from "jsonwebtoken";

const isLoggedIn = (req, res, next) => {
    const { token } = req.cookie;
    
    if(!token) {
        return next(new AppError('Unauthenticated, please login again', 401));
    }

    const userDeatails = jwt.verify(token, process.env.JWT_SECRET);

    req.user = userDeatails;
    next();
}

const authorizedRoles = (...roles) => async (req, res, next) => {
    const currentUserRole = req.user.role;
    if (!roles.includes(currentUserRole)) {
        return next(new AppError('You do not have permission to access this route', 403));
    }
    return next();
}



export {
    isLoggedIn,
    authorizedRoles
}