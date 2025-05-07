import { EmailService } from '../services/emailService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Example usage of the email service
 */
async function sendExampleEmails() {
  // Create an instance of the email service
  const emailService = new EmailService();

  console.log('Sending example emails...');

  // Example 1: Send a simple notification
  try {
    const result1 = await emailService.sendNotification(
      'recipient@example.com',
      'System Notification',
      'This is a test notification from the IOFRA system.'
    );
    console.log('Example 1 - Notification email sent:', result1);
  } catch (error) {
    console.error('Error sending notification email:', error);
  }

  // Example 2: Send an email with HTML content
  try {
    const result2 = await emailService.sendEmail({
      to: 'recipient@example.com',
      subject: 'IOFRA System Report',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h1 style="color: #333;">IOFRA System Report</h1>
          <p>Hello,</p>
          <p>Please find attached the latest system report.</p>
          <ul>
            <li>Total devices: 24</li>
            <li>Active devices: 18</li>
            <li>Offline devices: 6</li>
          </ul>
          <p>Thank you,<br>IOFRA System</p>
        </div>
      `,
    });
    console.log('Example 2 - HTML email sent:', result2);
  } catch (error) {
    console.error('Error sending HTML email:', error);
  }

  // Example 3: Send an email with attachments (requires file access)
  /*
  try {
    const result3 = await emailService.sendEmail({
      to: 'recipient@example.com',
      subject: 'IOFRA System Report with Attachment',
      text: 'Please find attached the latest system report.',
      attachments: [
        {
          filename: 'report.pdf',
          path: './reports/latest-report.pdf',
        },
      ],
    });
    console.log('Example 3 - Email with attachment sent:', result3);
  } catch (error) {
    console.error('Error sending email with attachment:', error);
  }
  */
}

// Run the examples
if (require.main === module) {
  sendExampleEmails()
    .then(() => {
      console.log('Example emails completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error in example:', error);
      process.exit(1);
    });
} 