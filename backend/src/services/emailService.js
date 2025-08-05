const nodemailer = require('nodemailer')
const { logger } = require('../utils/logger')

class EmailService {
  constructor() {
    this.transporter = null
    this.initializeTransporter()
  }

  initializeTransporter() {
    try {
      // SMTP Configuration - can be customized via environment variables
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || 'your-email@gmail.com',
          pass: process.env.SMTP_PASS || 'your-app-password'
        },
        tls: {
          rejectUnauthorized: false
        }
      }

      this.transporter = nodemailer.createTransport(smtpConfig)

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('SMTP connection error:', error)
          logger.warn('Email service will be disabled. Please check SMTP configuration.')
        } else {
          logger.info('✅ SMTP server is ready to send emails')
        }
      })

    } catch (error) {
      logger.error('Failed to initialize email service:', error)
    }
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized')
      }

      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'RecrutIA Platform',
          address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@recrutia.com'
        },
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      }

      const result = await this.transporter.sendMail(mailOptions)
      logger.info(`Email sent successfully to ${to}:`, result.messageId)
      return { success: true, messageId: result.messageId }

    } catch (error) {
      logger.error('Failed to send email:', error)
      return { success: false, error: error.message }
    }
  }

  async sendStatusUpdateEmail({ 
    recipientEmail, 
    recipientName, 
    subject, 
    body, 
    companyName = 'RecrutIA Platform',
    jobTitle = 'Position'
  }) {
    try {
      // Create HTML version of the email
      const htmlBody = this.textToHtml(body)

      const result = await this.sendEmail({
        to: recipientEmail,
        subject,
        html: this.createEmailTemplate({
          recipientName,
          body: htmlBody,
          companyName,
          jobTitle
        }),
        text: body
      })

      return result
    } catch (error) {
      logger.error('Failed to send status update email:', error)
      return { success: false, error: error.message }
    }
  }

  textToHtml(text) {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
  }

  htmlToText(html) {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .trim()
  }

  createEmailTemplate({ recipientName, body, companyName, jobTitle }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Status Update</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .content {
            margin-bottom: 30px;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 14px;
            color: #6c757d;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }
        p {
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">RecrutIA</div>
            <p style="margin: 0; color: #6c757d;">Application Status Update</p>
        </div>
        
        <div class="content">
            ${body}
        </div>
        
        <div class="footer">
            <p>This email was sent by ${companyName} via RecrutIA Platform.</p>
            <p>If you have any questions, please contact the hiring team directly.</p>
            <p style="font-size: 12px; margin-top: 20px;">
                © ${new Date().getFullYear()} RecrutIA Platform. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  // Test email functionality
  async sendTestEmail(recipientEmail) {
    try {
      const result = await this.sendEmail({
        to: recipientEmail,
        subject: 'RecrutIA - Email Service Test',
        html: this.createEmailTemplate({
          recipientName: 'Test User',
          body: '<p>This is a test email to verify that the email service is working correctly.</p><p>If you receive this email, the SMTP configuration is successful!</p>',
          companyName: 'RecrutIA Platform',
          jobTitle: 'Test'
        })
      })

      return result
    } catch (error) {
      logger.error('Failed to send test email:', error)
      return { success: false, error: error.message }
    }
  }
}

// Create singleton instance
const emailService = new EmailService()

module.exports = emailService
