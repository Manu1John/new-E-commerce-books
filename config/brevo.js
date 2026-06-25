import dotenv from "dotenv";
import SibApiV3Sdk from "sib-api-v3-sdk";

// 1. Force environment variables to load immediately
dotenv.config();

// 2. Validate that the key actually exists
const apiKeyStr = process.env.BREVO_API_KEY;

if (!apiKeyStr) {
    console.error("🚨 CRITICAL ERROR: BREVO_API_KEY is missing from your .env file!");
    process.exit(1); 
}

// 3. Initialize the SDK Client
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = apiKeyStr;
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// 4. Create a universal email sending function
const sendEmail = async (toEmail, subject, htmlContent) => {
    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        // Make sure you have a sender email! Brevo requires this.
        // You can hardcode this to your verified Brevo email if you prefer.
        sendSmtpEmail.sender = { name: process.env.SENDER_NAME, email: process.env.SENDER_EMAIL }; 
        sendSmtpEmail.to = [{ email: toEmail }];

        const result = await emailApi.sendTransacEmail(sendSmtpEmail);
        return result;
    } catch (error) {
        console.error("🚨 Brevo Send Error:", error);
        throw error;
    }
};

// 5. Export the FUNCTION, not the object
export default sendEmail;