const nodemailer = require('nodemailer');
const emailTemplate = {
from: '"noreply" <thelastswipe@gmail.com>',
subject: 'Email Verification Link',
text: 'Welcome to Chatflix! Please go to https://chatflix.org/members-area/verify to verify your email and start your 72 hour free trial',
html: "Welcome to Chatflix! Please <a href='https://chatflix.org/members-area/verify'><b>CLICK THIS LINK</b></a> to verify your email and start your 72 hour free trial"
}
async function sendEmail(to) {
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'thelastswipe@gmail.com', // your Gmail address
            pass: 'KillerApp123!', // your Gmail password or App Password
        },
    });
    emailTemplate.to = to

    let info = await transporter.sendMail(emailTemplate);

    console.log('Message sent: %s', info.messageId);
}

sendEmail('samrahimi420@gmail.com').catch(console.error);
