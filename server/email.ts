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

interface BookingEmailData {
  clientName: string;
  clientEmail: string;
  startTime: Date;
  endTime: Date;
  meetingType: 'google_meet' | 'teams';
  meetingUrl?: string | null;
  notes?: string | null;
}

interface CreatorNotificationData {
  creatorName?: string | null;
  creatorEmail: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  startTime: Date;
  endTime: Date;
  meetingType: 'google_meet' | 'teams';
  meetingUrl?: string | null;
  notes?: string | null;
}

export function generateGoogleCalendarLink(
  title: string,
  startTime: Date,
  endTime: Date,
  description: string,
  location?: string
): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDate(startTime)}/${formatDate(endTime)}`,
    details: description,
  });

  if (location) {
    params.append('location', location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<void> {
  if (!transporter) {
    console.warn('⚠️  Email not configured - booking confirmation not sent');
    return;
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  };

  const calendarLink = generateGoogleCalendarLink(
    'Opian Capital Consultation',
    data.startTime,
    data.endTime,
    `Consultation meeting with Opian Capital.\n\nMeeting Link: ${data.meetingUrl || 'Will be provided'}\n\nNotes: ${data.notes || 'None'}`,
    data.meetingUrl || undefined
  );

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM,
    to: data.clientEmail,
    subject: 'Booking Confirmed - Opian Capital Consultation',
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
              background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%);
              color: #1a1a1a;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 40px 30px;
              border-radius: 0 0 10px 10px;
            }
            .booking-details {
              background: white;
              border: 2px solid #D4AF37;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
            }
            .detail-row {
              display: flex;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              width: 140px;
              color: #6b7280;
            }
            .detail-value {
              flex: 1;
              color: #1a1a1a;
            }
            .cta-button {
              display: inline-block;
              background: #D4AF37;
              color: #1a1a1a;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 10px 5px;
            }
            .meeting-link {
              background: #667eea;
              color: white;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">Opian Capital</h1>
            <p style="margin: 10px 0 0 0;">Investment Consultation Confirmed</p>
          </div>
          <div class="content">
            <h2>Hello ${data.clientName}!</h2>
            <p>Your consultation has been successfully booked. We look forward to discussing your investment journey with you.</p>
            
            <div class="booking-details">
              <h3 style="margin-top: 0; color: #D4AF37;">Booking Details</h3>
              <div class="detail-row">
                <div class="detail-label">Date & Time:</div>
                <div class="detail-value">${formatDateTime(data.startTime)}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Duration:</div>
                <div class="detail-value">${Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60))} minutes</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Meeting Type:</div>
                <div class="detail-value">${data.meetingType === 'google_meet' ? 'Google Meet' : 'Microsoft Teams'}</div>
              </div>
              ${data.meetingUrl ? `
              <div class="detail-row">
                <div class="detail-label">Meeting Link:</div>
                <div class="detail-value"><a href="${data.meetingUrl}" style="color: #667eea;">${data.meetingUrl}</a></div>
              </div>
              ` : ''}
              ${data.notes ? `
              <div class="detail-row">
                <div class="detail-label">Notes:</div>
                <div class="detail-value">${data.notes}</div>
              </div>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${calendarLink}" class="cta-button" style="color: #1a1a1a;">Add to Google Calendar</a>
              ${data.meetingUrl ? `<a href="${data.meetingUrl}" class="cta-button meeting-link" style="color: white;">Join Meeting</a>` : ''}
            </div>
            
            <div class="footer">
              <p><strong>Need to reschedule?</strong><br>
              Please contact us as soon as possible to arrange a new time.</p>
              
              <p style="margin-top: 20px;">
                Best regards,<br>
                <strong>The Opian Capital Team</strong>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hello ${data.clientName}!

Your consultation with Opian Capital has been successfully booked.

BOOKING DETAILS:
- Date & Time: ${formatDateTime(data.startTime)}
- Duration: ${Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60))} minutes
- Meeting Type: ${data.meetingType === 'google_meet' ? 'Google Meet' : 'Microsoft Teams'}
${data.meetingUrl ? `- Meeting Link: ${data.meetingUrl}` : ''}
${data.notes ? `- Notes: ${data.notes}` : ''}

Add to Google Calendar: ${calendarLink}

Need to reschedule? Please contact us as soon as possible.

Best regards,
The Opian Capital Team
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Booking confirmation sent to ${data.clientEmail}`);
  } catch (error) {
    console.error('❌ Error sending booking confirmation:', error);
    throw error;
  }
}

export async function sendCreatorNotificationEmail(data: CreatorNotificationData): Promise<void> {
  if (!transporter) {
    console.warn('⚠️  Email not configured - creator notification not sent');
    return;
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  };

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM,
    to: data.creatorEmail,
    subject: 'New Booking Received - Opian Capital',
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
              background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%);
              color: #1a1a1a;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 40px 30px;
              border-radius: 0 0 10px 10px;
            }
            .booking-details {
              background: white;
              border: 2px solid #D4AF37;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
            }
            .detail-row {
              display: flex;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              width: 140px;
              color: #6b7280;
            }
            .detail-value {
              flex: 1;
              color: #1a1a1a;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">Opian Capital</h1>
            <p style="margin: 10px 0 0 0;">New Booking Received</p>
          </div>
          <div class="content">
            <h2>Hello${data.creatorName ? ` ${data.creatorName}` : ''}!</h2>
            <p>You have received a new booking for your consultation time slot.</p>
            
            <div class="booking-details">
              <h3 style="margin-top: 0; color: #D4AF37;">Client Information</h3>
              <div class="detail-row">
                <div class="detail-label">Name:</div>
                <div class="detail-value">${data.clientName}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Email:</div>
                <div class="detail-value"><a href="mailto:${data.clientEmail}" style="color: #667eea;">${data.clientEmail}</a></div>
              </div>
              ${data.clientPhone ? `
              <div class="detail-row">
                <div class="detail-label">Phone:</div>
                <div class="detail-value">${data.clientPhone}</div>
              </div>
              ` : ''}
              
              <h3 style="margin-top: 20px; color: #D4AF37;">Meeting Details</h3>
              <div class="detail-row">
                <div class="detail-label">Date & Time:</div>
                <div class="detail-value">${formatDateTime(data.startTime)}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Duration:</div>
                <div class="detail-value">${Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60))} minutes</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Meeting Type:</div>
                <div class="detail-value">${data.meetingType === 'google_meet' ? 'Google Meet' : 'Microsoft Teams'}</div>
              </div>
              ${data.meetingUrl ? `
              <div class="detail-row">
                <div class="detail-label">Meeting Link:</div>
                <div class="detail-value"><a href="${data.meetingUrl}" style="color: #667eea;">${data.meetingUrl}</a></div>
              </div>
              ` : ''}
              ${data.notes ? `
              <div class="detail-row">
                <div class="detail-label">Client Notes:</div>
                <div class="detail-value">${data.notes}</div>
              </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p>The client has been sent a confirmation email with all the meeting details.</p>
              
              <p style="margin-top: 20px;">
                Best regards,<br>
                <strong>The Opian Capital Team</strong>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hello${data.creatorName ? ` ${data.creatorName}` : ''}!

You have received a new booking for your consultation time slot.

CLIENT INFORMATION:
- Name: ${data.clientName}
- Email: ${data.clientEmail}
${data.clientPhone ? `- Phone: ${data.clientPhone}` : ''}

MEETING DETAILS:
- Date & Time: ${formatDateTime(data.startTime)}
- Duration: ${Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60))} minutes
- Meeting Type: ${data.meetingType === 'google_meet' ? 'Google Meet' : 'Microsoft Teams'}
${data.meetingUrl ? `- Meeting Link: ${data.meetingUrl}` : ''}
${data.notes ? `- Client Notes: ${data.notes}` : ''}

The client has been sent a confirmation email with all the meeting details.

Best regards,
The Opian Capital Team
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Creator notification sent to ${data.creatorEmail}`);
  } catch (error) {
    console.error('❌ Error sending creator notification:', error);
    throw error;
  }
}
