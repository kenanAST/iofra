import { Request, Response } from 'express';
import { EmailService, EmailOptions } from '../services/emailService';

const emailService = new EmailService();

export const sendEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { to, subject, text, html, attachments } = req.body as EmailOptions;

    if (!to || !subject || (!text && !html)) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const success = await emailService.sendEmail({
      to,
      subject,
      text,
      html,
      attachments
    });

    if (success) {
      res.status(200).json({ success: true, message: 'Email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending email', error });
  }
};

export const sendNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const success = await emailService.sendNotification(to, subject, message);

    if (success) {
      res.status(200).json({ success: true, message: 'Notification email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send notification email' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending notification email', error });
  }
}; 