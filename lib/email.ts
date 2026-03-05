import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[email] SMTP environment variables not set. Skipping password reset email send.')
    return
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Recruitment Platform" <no-reply@yourdomain.com>`,
      to,
      subject: 'Reset your password',
      html: `
        <p>Hello,</p>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetLink}">Click here to reset your password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
        <p>– Recruitment Platform</p>
      `,
      text: `Reset your password: ${resetLink}`,
    })
  } catch (error) {
    console.error('[email] Failed to send password reset email', error)
  }
}

