import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import sendEmail from "../utils/sendEmail.js";
import crypto from 'crypto';

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

    // File Uploading

    console.log('File Details >', JSON.stringify(req.file));
    if(req.file) {
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: `lms`,
                width: 250,
                height: 250,
                gravity: 'faces',
                crop: 'fill'
            });

            if(result) {
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                // Remove file
                fs.rm(`uploads/${req.file.filename}`);
            }
        } catch (err) {
            return next(
                new AppError(err || 'File not uploaded, please try again!', 500)
            )
            
        }
    }

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

const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    if(!email) {
        return next(new AppError('Please enter your registered email address', 401));
    }

    const user = await User.findOne({email});

    if(!user) {
        return next(new AppError('Email not registered', 401));
    }

    const resetToken = await user.generatePasswordResetToken();

    await user.save();

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const subject = 'Reset Password';
    const message = `You can reset ou password by clicking <a href=${resetPasswordUrl} target="_blank"> Reset your password`

    try {
        await sendEmail(email, subject, message);
        res.status(200).json({
            success: true,
            message: `An email has been sent for reset password to ${email} with further instructions.`
        });
    } catch(err) {
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;

        await user.save();
        return next(new AppError(err.message, 401));
    }
}

const resetPassword = async (req, res) => {
    const { resetToken } = req.params;

    const { password } = req.body;

    const forgotPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    });
    if(!user) {
        return next(new AppError(`Invalid or expired token`, 403));
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    user.save();

    res.status(200).json({
        success :true ,
        message:`Your account's password was successfully updated and you can now login using your new password.`
    });
}
export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword
}