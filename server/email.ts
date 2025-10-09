import nodemailer from 'nodemailer';

// Check if email is configured
const isEmailConfigured = () => {
  return !!(
    (process.env.EMAIL_HOST || process.env.SMTP_HOST) &&
    (process.env.EMAIL_USER || process.env.SMTP_USER) &&
    (process.env.EMAIL_PASS || process.env.SMTP_PASS)
  );
};

// Only create transporter if email is configured
const transporter = isEmailConfigured() 
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
      port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
      secure: (process.env.EMAIL_PORT || process.env.SMTP_PORT) === '465',
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
      },
    })
  : null;

export async function sendOtpEmail(email: string, code: string, firstName?: string) {
  if (!transporter) {
    console.warn('⚠️  Email not configured - OTP code would be:', code);
    throw new Error('Email service not configured. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables.');
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM,
    to: email,
    subject: 'Your Opian Rewards Login Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 40px 30px;
              border-radius: 0 0 10px 10px;
            }
            .otp-code {
              background: white;
              border: 2px solid #667eea;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px 16px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">🚀 Opian Rewards</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">The Ascendancy Project</p>
          </div>
          <div class="content">
            <h2>Hello${firstName ? ` ${firstName}` : ''}!</h2>
            <p>You've requested to log in to your Opian Rewards investor portal. Here's your one-time verification code:</p>
            
            <div class="otp-code">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your Verification Code</p>
              <div class="code">${code}</div>
            </div>
            
            <div class="warning">
              <strong>⏰ This code will expire in 10 minutes</strong>
            </div>
            
            <p>Enter this code on the login page to access your dashboard and track your investment progress.</p>
            
            <div class="footer">
              <p><strong>Didn't request this code?</strong><br>
              If you didn't try to log in, you can safely ignore this email. Your account remains secure.</p>
              
              <p style="margin-top: 20px;">
                Best regards,<br>
                <strong>The Opian Rewards Team</strong>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hello${firstName ? ` ${firstName}` : ''}!

You've requested to log in to your Opian Rewards investor portal.

Your verification code is: ${code}

This code will expire in 10 minutes.

Enter this code on the login page to access your dashboard and track your investment progress.

Didn't request this code? If you didn't try to log in, you can safely ignore this email.

Best regards,
The Opian Rewards Team
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw error;
  }
}

export async function testEmailConnection() {
  if (!transporter) {
    console.log('⚠️  Email not configured - skipping connection test');
    console.log('💡 To enable email: Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM environment variables');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return false;
  }
}
