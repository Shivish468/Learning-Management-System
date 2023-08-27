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

export {
    isLoggedIn
}