import { Resend } from 'resend';
import { communityConfig } from '@/config/community';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default from email (should match your verified domain in Resend)
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || `${communityConfig.name} <noreply@example.com>`;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send a single email
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error('❌ [EMAIL] Failed to send:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [EMAIL] Sent successfully:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('❌ [EMAIL] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export interface BroadcastEmailOptions {
  recipients: { email: string; name?: string }[];
  subject: string;
  html: string;
  text?: string;
}

export interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Send a broadcast email to multiple recipients
 * Uses Resend's batch API for efficiency
 */
export async function sendBroadcastEmail(options: BroadcastEmailOptions): Promise<BroadcastResult> {
  const result: BroadcastResult = {
    total: options.recipients.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  if (options.recipients.length === 0) {
    return result;
  }

  // Resend batch API supports up to 100 emails per request
  const BATCH_SIZE = 100;
  const batches: { email: string; name?: string }[][] = [];
  
  for (let i = 0; i < options.recipients.length; i += BATCH_SIZE) {
    batches.push(options.recipients.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    try {
      const emails = batch.map(recipient => ({
        from: DEFAULT_FROM_EMAIL,
        to: recipient.email,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }));

      const { data, error } = await resend.batch.send(emails);

      if (error) {
        console.error('❌ [BROADCAST] Batch failed:', error);
        result.failed += batch.length;
        result.errors.push(error.message);
      } else {
        // Count successful sends
        const successCount = data?.data?.filter(d => d.id)?.length || 0;
        result.sent += successCount;
        result.failed += batch.length - successCount;
        console.log(`✅ [BROADCAST] Batch sent: ${successCount}/${batch.length}`);
      }
    } catch (error) {
      console.error('❌ [BROADCAST] Batch error:', error);
      result.failed += batch.length;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return result;
}

/**
 * Generate a simple HTML email template
 */
export function generateEmailTemplate(options: {
  title: string;
  content: string;
  preheader?: string;
  footerText?: string;
}): string {
  const { title, content, preheader, footerText } = options;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #eee;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: ${communityConfig.theme.primary};
    }
    .content {
      font-size: 16px;
      color: #333;
    }
    .content h1, .content h2, .content h3 {
      color: #111;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .content p {
      margin: 0 0 16px 0;
    }
    .content a {
      color: ${communityConfig.theme.primary};
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .preheader {
      display: none;
      font-size: 1px;
      color: #f5f5f5;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">${communityConfig.name}</div>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        ${footerText || `You're receiving this email because you're a member of ${communityConfig.name}.`}
        <br><br>
        ${communityConfig.contact?.email ? `<a href="mailto:${communityConfig.contact.email}">Contact us</a>` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
