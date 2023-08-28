import Course from "../models/course.model.js";
import AppError from "../utils/error.util.js";

const getAllCourses = async function(req, res, next) {
    const courses = await Course.find({}).select('-lectures');
    
    try {
        res.status(200).json({
            success: true,
            message: "All courses",
            courses,
        });
    } catch (err) {
        return next(
            new AppError(err.message, 500));
    }
}

const getLecturesByCourseId = async function(req, res, next) {
    try {
        const { id } = req.params;
        console.log('Course Id >', id);

        const course = await Course.findById(id);
        console.log('Course Detail >', course);

        if(!course) {
            return next(new AppError('No such course found with that ID.',505));
        }

        res.status(200).json({
            success: true ,
            message: 'Course lectures fetched successfully',
            lectures: Course.lectures
        });
    } catch (err) {
        return next(new AppError(err.message,501));
    }
}

export {
    getAllCourses,
    getLecturesByCourseId
}