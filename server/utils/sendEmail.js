import nodemailer from "nodemailer";

// async..await is not allowed in global scope, mst use a wrapper
const sendEmail = async function(email, subject, message) {
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true, // True for 587, false for other ports
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD,
        },
    });
    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL, // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        html: message // html body
  });
}

export default sendEmail;


  

  
