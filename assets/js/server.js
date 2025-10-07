import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

dotenv.config();
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// simple rate-limit
const limiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
app.use('/api/', limiter);

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g. smtp.gmail.com (if using app password) or Mailgun/Sendgrid
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // true for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.MAIL_FROM}>`,
      to: process.env.MAIL_TO, // your inbox
      subject: `New message from ${name}`,
      replyTo: email,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${message.replace(/\n/g,'<br>')}</p>`
    });

    console.log('Mail sent:', info.messageId);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Send failed' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
