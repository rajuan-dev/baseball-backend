import { Resend } from 'resend';

import { env } from '../config/env';
import { logger } from '../logger';

const resendClient = new Resend(env.RESEND_API_KEY);

const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  await resendClient.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: 'Your OTP Code',
    html: `<p>Your OTP code is <strong>${otp}</strong>. It will expire soon.</p>`,
  });

  logger.info('OTP email dispatched via Resend', {
    email,
  });
};

export const resendService = {
  client: resendClient,
  sendOtpEmail,
};
