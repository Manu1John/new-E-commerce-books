import emailApi from "./config/brevo.js";

const run = async () => {
  try {
    const res = await emailApi.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL,
        name: "Test"
      },
      to: [{ email: process.env.SENDER_EMAIL }],
      subject: "Test",
      htmlContent: "<h1>Hello</h1>"
    });

    console.log("SUCCESS:", res);
  } catch (e) {
    console.log("ERROR:", e?.response?.text || e.message);
  }
};

run();