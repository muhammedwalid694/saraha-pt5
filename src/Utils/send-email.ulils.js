import nodemailer from "nodemailer";
import { EventEmitter } from "node:events";

export const emitter = new EventEmitter();

let transporter;
const getTransporter = () =>
    (transporter ??= nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: process.env.USER_EMAIL, pass: process.env.USER_PASSWORD }
    }));

export const sendEmail = async ({ to, cc, subject, content, attachments = [] }) => {
    const info = await getTransporter().sendMail({
        from: `"Saraha App" <${process.env.USER_EMAIL}>`,
        to,
        cc,
        subject,
        html: content,
        attachments
    });
    console.log("Email sent:", info.messageId);
    return info;
};

// Fire-and-forget: a failed email must never crash the process (unhandled rejection).
emitter.on("sendEmail", async (data) => {
    try {
        await sendEmail(data);
    } catch (error) {
        console.error("Failed to send email:", error.message);
    }
});
