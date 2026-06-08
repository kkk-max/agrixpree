const { Resend } = require('resend');
const logger = require('./logger');

const sendOtpEmail = async ({ to, otp, purpose }) => {
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const subjects = {
    registration: 'Verify your AgriXpree account',
    password_reset: 'Reset your AgriXpree password',
    login: 'Your AgriXpree login OTP'
  };

  const labels = {
    registration: 'account verification',
    password_reset: 'password reset',
    login: 'login'
  };

  if (!resend) {
    console.log(`\n📧 OTP for ${to}: ${otp}\n`);
    return;
  }
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'AgriXpree <onboarding@resend.dev>',
      to,
      subject: subjects[purpose] || 'Your AgriXpree OTP',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#2d6a4f;">AgriXpree</h2>
          <p>Your OTP for ${labels[purpose] || purpose} is:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2d6a4f;margin:24px 0;">${otp}</div>
          <p style="color:#666;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `
    });
    logger.info(`OTP email sent to ${to}`);
  } catch (err) {
    logger.error(`Failed to send OTP email to ${to}: ${err.message}`);
    // Log OTP to console as fallback during development
    console.log(`\n📧 OTP for ${to}: ${otp}\n`);
  }
};

module.exports = { sendOtpEmail };
