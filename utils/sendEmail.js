const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, text }) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: 'test70455@gmail.com',
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: process.env.ACCESS_TOKEN 
        },
    });

    const mailOptions = {
        from: '"Rishabh" <test70455@gmail.com>', 
        to: to, 
        subject: subject, 
        text: text, 
      
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log("Error sending email: ", error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = sendEmail;
