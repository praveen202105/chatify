import nodemailer from "nodemailer";
import { ENV } from "./env.js";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: ENV.EMAIL_FROM,
    pass: ENV.EMAIL_APP_PASSWORD
  },
});


export const sender = {
  email: ENV.EMAIL_FROM,
  name: ENV.EMAIL_FROM_NAME,
};
