import { transporter, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate } from "../emails/emailTemplates.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  try {
    console.log(`Attempting to send welcome email to: ${email}`);
    console.log(`From: ${sender.name} <${sender.email}>`);

    const mailOptions = {
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "Welcome to Chatify!",
      html: createWelcomeEmailTemplate(name, clientURL),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Welcome Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending welcome email:");
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};
