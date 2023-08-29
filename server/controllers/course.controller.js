import Course from "../models/course.model.js";
import AppError from "../utils/error.util.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';

const getAllCourses = async function(req, res, next) {
    try {
        const courses = await Course.find({}).select('-lectures');
        if(!courses) {
            return next(new AppError("Course are not available"));
        }
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

const createCourse = async function(req, res, next) {
    try {
        const { title ,description ,category,createdBy } = req.body;
   
        if(!title || !description || !category ||!createdBy) {
            return next(new AppError("All fileds are required",400))
        }
        const course=await Course.create({
            title,
            description,
            category,
            createdBy,
            thumbnail:  {
                public_id: 'Dummy',
                secure_url: 'Dummy',
            },
        });
        if(!course) {
            return next(new AppError("Course could not created, please try again",500));
        }
        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: "lms",
                });
                console.log(JSON.stringify(result));
                if (result) {
                    course.thumbnail.public_id = result.public_id;
                    course.thumbnail.secure_url = result.secure_url;
                }
                fs.rm(`uploads/${req.file.filename}`);
            } catch (e) {
                return next(new AppError(e.message, 500));
            }
        }
        await course.save();

        res.status(200).json({
            success:true,
            message:"Course created successfully",
            course,
        });
    } catch (err) {
        return next( new AppError('Internal Server Error' + err?.message ?? '', 500));
    }
}

const updateCourse = async function(req, res, next) {
    try {
        const { id }=req.params;
        const course = await Course.findByIdAndUpdate(
            id,
            {
                $set: req.body
            },
            {
                runValidator: true
            }
        );
        
        if(!course) {
            return next(new AppError("Course with given id does not exist", 400));
        }
        
        res.status(200).json({
            success: true,
            message: "course updated successfully",
            course,
        });
    } catch (err) {
        return next( new AppError('Internal Server Error' + err.message, 505));
    }
}

const removeCourse = async function(req, res,next) {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);

        if (!course) {
            return next(new AppError("Course with given id does not exist", 400));
        }
        await course.findByIdAndDelete(id);
        
        res.status(200).json({
            success:true,
            message:"Course deleted SuccessFully"
        })
    } catch (err) {
        return next( new AppError('Internal Server Error' + err.message, 505));
    }
}

const addLectureToCourseById = async function(req, res, next) {
    try {
        
        const { title, description } = req.body;
        const { id } = req.params;
    
        if(!title || !description) {
            return next(new AppError("All fileds are required",400));
        }
    
        const course = await Course.findById(id);
    
        if(!course) {
            return next(new AppError(`No such course found for ID ${id}`, 401));
        }
    
        const lectureData = {
            title : title ,
            description : description,
            lecture: {}
        }
        
        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: "lms",
                });
                console.log(JSON.stringify(result));
                if (result) {
                    lectureData.lecture.public_id = result.public_id;
                    lectureData.lecture.secure_url = result.secure_url;
                }
                fs.rm(`uploads/${req.file.filename}`);
            } catch (err) {
                return next(new AppError(err.message, 500));
            }
        }
    
        course.lectures.push(lectureData);
        course.numbersOfLectures = course.lectures.length;
    
        await course.save();
    
        res.status(200).json({
            success: true,
            message:`New Lecture added to the course`,
            course
        })
    } catch (err) {
        return next( new AppError('Internal Server Error' + err.message, 505));
    }
}

export {
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    removeCourse,
    addLectureToCourseById
}