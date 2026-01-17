const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendRfpEmail = async ({ to, subject, text }) => {
  await transporter.sendMail({
    from: `"Procurement" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
};

module.exports = { sendRfpEmail };
