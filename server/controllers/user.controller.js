import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";

const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: true
}

const register = async (req, res, next) => {
    const {fullName, email, password} = req.body;

    if(!fullName || !email || !password) {
        return next(new AppError('Please fill all fields', 400));
    }

    const userExists = await User.findOne({email});

    if(userExists) {
        return next(new AppError(`User with ${email} already exists`, 409));
    }

    const user = await User.create({
        fullName,
        email,
        password,
        avatar: {
            public_id: email,
            secure_url: `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/image/upload/`
        }
    });
        
    if(!user) {
        return next(new AppError("Something went wrong, please try again", 500));
    }

    //TODO: File Upload

    await user.save();

    user.password = undefined;

    const token = await user.generateJWTToken();

    res.cookie('token', token, cookieOptions)

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user
    });
};
        
const login = async (req, res) => {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return next(new AppError('All fields are required', 400));
        }
    
        const user = await User.findOne({
            email: email
        })
        .select('+password');
    
        if(!user || user.comparePassword(password)) {
            return next(new AppError('Email or password does not match', 403));
        }
    
        const token = await user.generateJWTToken();
        user.password = undefined;
    
        res.cookie('token', token, cookieOptions);
    
        res.status(200).json({
            success: true,
            message: 'Loggedin successfully',
            user
        });
        
    } catch (err) {
        return next(new AppError(err.message, 500));
    }
};

const logout = (req, res) => {
    res.clearCookie('token', null);

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    })
};

const getProfile = async (req, res) => {
    try {
        
        const userId = req.user.id;
        const user =  await user.findById(userId);
    
        res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            user,
        });
    } catch (err) {
        return next(new AppError('Failed to fetch user profile', 500));
    }
};
        

export {
    register,
    login,
    logout,
    getProfile
}