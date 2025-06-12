import nodemailer from "nodemailer";

const testAccount = await nodemailer.createTestAccount();


// Create a test account or replace with real credentials.
// const transporter = nodemailer.createTransport({
//   host: "smtp.ethereal.email",
//   port: 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: "sophia.kunze35@ethereal.email",
//     pass: "sgCNtWzE7Njkv6WNPr",
//   },
// });
// Configure the SMTP transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL,        // Gmail address
        pass: process.env.EMAIL_PASS    // Gmail App Password
    }
});

export const sendEmail = async({to,subject,html}) =>{
    const info = await transporter.sendMail({
        from:`'URL SHORTENER' <${testAccount.user}>`,
        to,subject,html
    })
const testEmailURL = nodemailer.getTestMessageUrl(info);
console.log("verify Email", testEmailURL);

}

