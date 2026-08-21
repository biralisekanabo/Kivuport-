type BrevoEmail = {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
};

export async function sendBrevoEmail(email: BrevoEmail) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.MAIL_FROM_ADDRESS;
  const senderName = process.env.MAIL_FROM_NAME || "KivuPort";

  if (!apiKey || !senderEmail) {
    throw new Error("Brevo is not configured. Set BREVO_API_KEY and MAIL_FROM_ADDRESS.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      ...email,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Brevo rejected the email (${response.status}): ${details}`);
  }

  return response.json() as Promise<{ messageId?: string }>;
}