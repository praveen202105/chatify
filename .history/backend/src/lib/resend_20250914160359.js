import nodemailer from "nodemailer";
import { ENV } from "./env.js";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // secure port
  secure: true,
  auth: {
    user: ENV.EMAIL_FROM,
    pass: ENV.EMAIL_APP_PASSWORD, // App Password
  },
});

export const sender = {
  email: ENV.EMAIL_FROM,
  name: ENV.EMAIL_FROM_NAME,
};
