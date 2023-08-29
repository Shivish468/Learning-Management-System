import User from "../models/user.model.js";
import { razorpay } from "../server.js";
import AppError from "../utils/error.util.js";
import crypto from 'crypto';

export const getRazorpayApiKey = async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: 'Razorpay API key',
        key: process.env['RAZORPAY_KEY']
    });
}

export const buySubscription = async (req, res, next) => {
    try {
        const { id } = req.user;
        const user = await User.findById(id);
        
        if(!user) {
            return next(new AppError('Unauthorized, please login'))
        }

        if(user.role === 'ADMIN') {
            return next(
                new AppError(`Admin not authorized to perform this action`)
            );
        }

        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 1
        });

        user.subscription.id = subscription.id;
        user.subscription.status = subscription.status;

        await user.save();

        res.status(200).json({
            success: true,
            message:'Subscribed Successfully',
            subscription_id: subscription.id
        });
    } catch (err) {
        return next(
            new AppError('Internal server error' + err.message, 505)
        );
    }
}

export const verifySubscription = async (req, res, next) => {
    try {
        
        const { id } = req.user;
        const { payment_id, subscription_id, signature } = req.body;
    
        const user = await User.findById(id);
        if(!user) {
            return next(
                new AppError("User does not exist")
            );
        }
    
        const subscriptionId = user.subscription.id;
    
        const generatedSignature = crypto
            .createHmac('sha256',process.env.RAZORPAY_SECRETKEY )
            .update(`${payment_id}${subscriptionId}`)
            .digest('hex');
    
        if(generatedSignature !== signature) {
            return next(
                new AppError('Invalid Signature, please try again', 500)
            );
        }
    
        await payment.create({
            razorpayPaymentId : payment_id ,
            razorpaySubscriptionId: subscription_id,
            razorpaySignature: signature
        });
    
        user.subscription.status = 'active';
        await user.save();
    
        res.status(200).json({
            success:true,
            message:"Payment verified successfully"
        });
    } catch (err) {
        return next(
            new AppError(`An unexpected error occured while processing your request ${err}`,401)
        )
    }
}

export const cancelSubsccription = async (req, res, next) => {
    try {
        
        const { id } = req.user;
        const user = await User.findById(id);
    
        if(!user) {
            return next(
                new AppError ("User doesn't exists",401)
            );
        }
    
        if(user.role == 'ADMIN') {
            return next(
                new AppError('Admin cannot be cancelled from the platform.',403)
            );
        }
    
        const subscriptionId = user.subscription.id;
    
        const subscription = await razorpay.subscriptions.cancel({
            subscriptionId
        });
    
        user.subscription.status = subscription.status;
        await user.save();
    } catch (err) {
        return next(
            new AppError("Something went wrong while cancelling your subscripton.",500)
        );
    }

}

export const allPayments = async (req, res, next) => {
    const { count } = req.query;
    const payments = await razorpay.subscriptions.all({
        count: count || 10
    });

    res.status(200).json({
        success : true ,
        message: 'All payments',
        subscriptions
    });

}
