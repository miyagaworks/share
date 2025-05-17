// scripts/test-email.js
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// __dirname の設定（ESモジュールでは__dirnameが使えないため）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// .env.local ファイルを明示的に読み込む
dotenv.config({ path: path.resolve(rootDir, '.env.local') });

console.log('Environment variables check:');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Not set');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM ? 'Set' : 'Not set');

const resend = new Resend('re_EChzKFNu_D4EXy86QxKcgGnPWiUxxLFGA');

async function testEmail() {
  console.log('Starting email test...');

  try {
    // Replace with your actual email address
    const testEmailAddress = 'miyagawakiyomi@gmail.com';

    const result = await resend.emails.send({
      from: 'onboarding@resend.dev', // Resendが提供するデフォルトドメイン
      to: testEmailAddress,
      subject: 'Test Email',
      text: 'This is a test email. If you received this, the email sending function is working properly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Test Email</h1>
          <p>This is a test email.</p>
          <p>If you received this, the email sending function is working properly.</p>
          <p>Test time: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send email:');
    if (error.response) {
      console.error('Response error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    } else {
      console.error('Error details:', error);
    }
  }
}

testEmail();
