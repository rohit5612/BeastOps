import nodemailer from 'nodemailer';
import { loadConfig } from '../config/index.js';

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }
  const config = loadConfig();
  if (!config.email.user || !config.email.pass) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
  return cachedTransporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const config = loadConfig();
  const transporter = getTransporter();
  const from = config.email.from || config.email.user || 'noreply@beastops.local';
  const resolvedSubject = `${config.email.subjectPrefix || '[BeastOps]'} ${subject}`;

  if (!transporter) {
    // eslint-disable-next-line no-console
    console.log('[mail:dev-fallback]', { to, subject: resolvedSubject, text });
    return { queued: true, fallback: true };
  }

  await transporter.sendMail({
    from,
    to,
    subject: resolvedSubject,
    text,
    html,
  });
  return { queued: true, fallback: false };
}
