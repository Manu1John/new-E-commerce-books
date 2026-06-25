import emailApi from "../config/brevo.js";

export const sendOtpEmail = async (email, otp) => {
    try {
        const response = await emailApi.sendTransacEmail({
            sender: {
                name: process.env.SENDER_NAME || "Admin System",
                email: process.env.SENDER_EMAIL
            },
            to: [
                { email: email }
            ],
            subject: "OTP Verification",
            htmlContent: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Verify Your Email</h2>
                    <h1 style="letter-spacing: 5px; color: #333;">
                        ${otp}
                    </h1>
                    <p style="color: #666;">
                        This OTP expires in <strong>2 minutes</strong>. Do not share this code with anyone.
                    </p>
                </div>
            `
        });

        console.log("✅ EMAIL SUCCESS:", response.messageId);
        return response;

    } catch (error) {
        console.error("❌ BREVO ERROR:");
        // Better error logging to catch exactly why Brevo might fail
        console.error(error.response?.text || error.message);
        throw error;
    }
};