import nodemailer from "nodemailer";
import { ENV } from "./env.js";


export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: ENV.EMAIL_FROM,
    pass: ENV.EMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 20000,
  rateLimit: 5
});


export const sender = {
  email: ENV.EMAIL_FROM,
  name: ENV.EMAIL_FROM_NAME,
};

// Test email connection on startup
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email server connection verified successfully");
    return true;
  } catch (error) {
    console.error("❌ Email server connection failed:");
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      command: error.command
    });
    return false;
  }
};
