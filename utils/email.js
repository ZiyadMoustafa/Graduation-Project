const nodemailer = require('nodemailer');

const sendEMail = async (options) => {
  // 1) Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: `"Nezamk Team" <${process.env.GMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3) Send email

  await transporter.sendMail(mailOptions);
};

module.exports = sendEMail;
