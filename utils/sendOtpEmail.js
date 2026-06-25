import emailApi from "../config/brevo.js";

export const sendOtpEmail = async (email, otp) => {
    // 1. Safety check: Prevent confusing Brevo API errors if the .env is missing this variable
    if (!process.env.SENDER_EMAIL) {
        throw new Error("🚨 SENDER_EMAIL is not defined in your .env file!");
    }

    try {
        const response = await emailApi.sendTransacEmail({
            sender: {
                name: process.env.SENDER_NAME || "E-Commerce System", 
                email: process.env.SENDER_EMAIL, // This MUST be a verified sender in your Brevo dashboard
            },
            to: [{ email }],
            subject: "Your OTP Verification Code",
            // 2. I added some basic inline CSS to make the email look cleaner
            htmlContent: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h2>OTP Verification</h2>
                    <p>Your verification code is:</p>
                    <h1 style="letter-spacing: 5px; color: #4F46E5; background: #F3F4F6; padding: 10px; border-radius: 8px; display: inline-block;">
                        ${otp}
                    </h1>
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        Please use this code to verify your account. Do not share this OTP with anyone.
                    </p>
                </div>
            `,
        });

        console.log(`✅ OTP Email successfully sent to: ${email}`);
        return response;

    } catch (error) {
        console.error("❌ BREVO EMAIL ERROR:");
        // This will grab the specific text from Brevo (like "Unauthorized" or "Invalid Sender")
        console.error(error.response?.text || error.message);
        
        // Pass the error back to your controller so it can respond to the frontend
        throw error; 
    }
};