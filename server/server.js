import {config} from 'dotenv';
config();
import app from'./app.js';
import connectionToDB from './config/dbConnection.js';
import cloudinary from 'cloudinary';


const PORT = process.env.PORT || 5001;

// cloudinary configuration
cloudinary.v2.config({ 
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.listen(PORT, async () => {
    await connectionToDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});