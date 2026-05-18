import dotenv from "dotenv";
dotenv.config(); // 🔥 FORCE LOAD HERE


import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendContactEmail = async ({ name, email, message }) => {
    return await resend.emails.send({
        from: "RCMI Contact <onboarding@resend.dev>",
        to: "praize.okidi@cpl.com.ng",
        subject: "New Contact Message",
        html: `
      <h2>New Contact Form Submission</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Message:</b> ${message}</p>
    `,
    });
};