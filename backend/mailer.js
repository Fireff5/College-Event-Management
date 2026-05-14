const nodemailer = require('nodemailer');

/**
 * Send an OTP verification email to a school.
 * Requires EMAIL_USER and EMAIL_PASS in environment (.env).
 */
async function sendOtpEmail(to, schoolName, otp) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"Sports Meet Portal" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Your OTP Verification Code – Sports Meet Portal',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #059669; margin-bottom: 8px;">Sports Meet Portal</h2>
                <p style="color: #475569; margin-bottom: 24px;">Hello <strong>${schoolName}</strong>,</p>
                <p style="color: #475569; margin-bottom: 16px;">
                    Use the code below to complete your school registration. It expires in <strong>5 minutes</strong>.
                </p>
                <div style="background: #f0fdf4; border: 2px dashed #34d399; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #065f46; font-family: monospace;">
                        ${otp}
                    </span>
                </div>
                <p style="color: #94a3b8; font-size: 13px;">
                    If you did not request this, you can safely ignore this email.
                </p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
