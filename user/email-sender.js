// File: emailSender.js

const nodemailer = require('nodemailer');


let transporter = nodemailer.createTransport({
    host: "smtp.eu.mailgun.org",
    port: 465,
    secure: true, // true for 465, use false for other ports
    auth: {
        user: 'noreply@mg.chatflix.org',
        pass: 'KillerApp123!'
    },
    socketTimeout: 5000
});

async function sendEmail(from, to, subject, bodyText, bodyHtml) {
    let mailOptions = {
        from, // sender address
        to, // list of receivers
        subject, // Subject line
        text: bodyText, // plain text body
        html: bodyHtml // html body
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error("Failed to send email:", error);
        return false;
    }
}

module.exports = { sendEmail };
