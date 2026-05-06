import nodemailer from "nodemailer";

/**
 * Sends an email using nodemailer.
 * @param {string} to - recipient email address
 * @param {string} subject - email subject
 * @param {string} message - email HTML content
 */

async function sendEmail(to, subject, message) {
  try {
    // 1. Create transporter (SMTP connection)
    const transporter = nodemailer.createTransport({
      host: process.env.NODEMAILER_HOST,
      port: process.env.NODEMAILER_PORT || 587,
      secure: process.env.NODEMAILER_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
      family: 4, // Use IPv4, skip IPv6
    });

    // 2. Email content
    const mailOptions = {
      from: `"WedPlanners" <${process.env.NODEMAILER_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial; padding: 15px;">
          ${message}
        </div>
      `,
    };

    // 3. Send email
    const info = await transporter.sendMail(mailOptions);

    return true;
  } catch (err) {
    console.error("Email sending failed: ", err);
    return false;
  }
}

export default sendEmail;
