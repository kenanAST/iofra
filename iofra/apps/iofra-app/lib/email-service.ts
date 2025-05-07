/**
 * Email Service for IoFRA application using the Nodemailer backend API
 * 
 * This service uses the backend email API which is implemented with Nodemailer
 * The backend expects these environment variables to be set:
 * - EMAIL_HOST (default: smtp.gmail.com)
 * - EMAIL_PORT (default: 587)
 * - EMAIL_SECURE (default: false)
 * - EMAIL_USER 
 * - EMAIL_PASSWORD
 * - EMAIL_FROM
 */

// Email validation regex 
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  fromName?: string;
}

/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Sends an email using the backend Nodemailer API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string }> {
  try {
    // Validate the recipient email
    if (!isValidEmail(options.to)) {
      return { success: false, message: 'Invalid recipient email address' };
    }

    // In development/testing, show what would be sent
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email would be sent with the following details:');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Body:', options.text);
      console.log('HTML:', options.html || 'No HTML version');
      
      // Check for required environment variables and log warnings
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.EMAIL_FROM) {
        console.warn('WARNING: Missing required email environment variables.');
        console.warn('Make sure the following variables are set in your environment:');
        console.warn('- EMAIL_USER: ' + (process.env.EMAIL_USER ? '✓' : '✗ Missing'));
        console.warn('- EMAIL_PASSWORD: ' + (process.env.EMAIL_PASSWORD ? '✓' : '✗ Missing'));
        console.warn('- EMAIL_FROM: ' + (process.env.EMAIL_FROM ? '✓' : '✗ Missing'));
      }
    }

    // Send via the backend API
    const response = await fetch(`${API_BASE_URL}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || `<div>${options.text.replace(/\n/g, '<br>')}</div>`,
      }),
    });

    const data = await response.json();
    
    // Return the result from the API
    return { 
      success: data.success, 
      message: data.message || 'Email processed'
    };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Enhanced error handling
    let errorMessage = 'Unknown error sending email';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Add more specific information for authentication errors
      if (errorMessage.includes('Missing credentials') || errorMessage.includes('EAUTH')) {
        errorMessage = 'Email authentication failed. Please check EMAIL_USER and EMAIL_PASSWORD environment variables.';
      }
    }
    
    return { 
      success: false, 
      message: errorMessage
    };
  }
}

/**
 * Formats an alert email with proper HTML
 */
export function formatAlertEmail(
  subject: string, 
  message: string, 
  data: { deviceName?: string; sensorType?: string; value?: any; timestamp?: string }
): { subject: string; text: string; html: string } {
  const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString();
  
  // Format plain text version
  const text = `
Alert: ${subject}
-------------------
${message}

Device: ${data.deviceName || 'Unknown'}
Sensor: ${data.sensorType || 'Unknown'}
Value: ${data.value !== undefined ? data.value : 'N/A'}
Time: ${timestamp}
  `;

  // Format HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .content { padding: 15px; background-color: #fff; border: 1px solid #e9ecef; border-radius: 5px; }
    .alert { color: #721c24; background-color: #f8d7da; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
    .footer { margin-top: 20px; font-size: 12px; color: #6c757d; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>IoFRA Alert Notification</h2>
    </div>
    <div class="content">
      <div class="alert">
        <strong>${subject}</strong>
      </div>
      <p>${message}</p>
      
      <table>
        <tr>
          <th>Information</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>Device</td>
          <td>'ESPMeow32'td>
        </tr>
        <tr>
          <td>MEOWERS</td>
          <td>DETECTED SOME MEOWWWS</td>
        </tr>
        <tr>
          <td>Value</td>
          <td>I love Meows</td>
        </tr>
        <tr>
          <td>TimeMeow</td>
          <td>MeowMeowMeow</td>
        </tr>
      </table>
    </div>
    <div class="footer">
      <p>This is an automated message from your IoFRA system. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  return {
    subject,
    text,
    html
  };
} 