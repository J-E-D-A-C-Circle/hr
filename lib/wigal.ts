/**
 * Frog / Wigal SMS & OTP Integration Service (v3 API)
 * Documentation: https://frogapi.wigal.com.gh/
 */

export interface SendSmsParams {
  destination: string;
  message: string;
  senderId?: string;
}

export interface GenerateOtpParams {
  destination: string;
  senderId?: string;
  expiryMinutes?: number;
  length?: number;
  messageTemplate?: string;
}

export interface VerifyOtpParams {
  destination: string;
  code: string;
}

export interface WigalApiResponse {
  success: boolean;
  status: number;
  data: any;
  formattedNumber: string;
}

/**
 * Normalizes Ghanaian phone numbers for Frog API v3.
 * e.g., '233241234567' or '0241234567' -> '0241234567' (or standard formatting)
 */
export function normalizePhoneForWigal(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('233') && cleaned.length === 12) {
    cleaned = '0' + cleaned.substring(3);
  }
  return cleaned;
}

/**
 * Sends a general SMS message using Frog API v3.
 * Endpoint: POST https://frogapi.wigal.com.gh/api/v3/sms/send
 */
export async function sendWigalSms({
  destination,
  message,
  senderId,
}: SendSmsParams): Promise<WigalApiResponse> {
  const apiKey = process.env.WIGAL_API_KEY || process.env.FROG_API_KEY || process.env.WIGAL_PASSWORD;
  const username = process.env.WIGAL_USERNAME || process.env.FROG_USERNAME || 'DVLA';
  const defaultSenderId = process.env.WIGAL_SENDER_ID || process.env.FROG_SENDER_ID || 'DVLA NSS';
  const source = senderId || defaultSenderId;

  const formattedNumber = normalizePhoneForWigal(destination);

  console.log(`📱 [Frog API v3 SMS] Sending SMS to ${formattedNumber} (Sender ID: ${source}): "${message}"`);

  if (!apiKey || !username) {
    console.warn('⚠️ [Frog API v3 SMS] WIGAL_API_KEY or WIGAL_USERNAME not set in environment variables.');
    return {
      success: false,
      status: 400,
      data: 'WIGAL_API_KEY and WIGAL_USERNAME must be set in .env',
      formattedNumber,
    };
  }

  try {
    const url = 'https://frogapi.wigal.com.gh/api/v3/sms/send';
    const msgId = `MSG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const payload = {
      senderid: source,
      destination: formattedNumber,
      message: message,
      msgid: msgId,
      smstype: 'text',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'API-KEY': apiKey,
        'USERNAME': username,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseData: any = responseText;
    try {
      responseData = JSON.parse(responseText);
    } catch {}

    console.log(`[Frog API v3 SMS] Response (${response.status}):`, responseText);

    const isSuccess =
      response.ok &&
      (typeof responseData !== 'object' ||
        (responseData?.status !== 'REJECTED' &&
         responseData?.status !== 'FAILED' &&
         responseData?.status !== 'ERROR' &&
         responseData?.status !== 'PERMISSION_DENIED'));

    return {
      success: Boolean(isSuccess),
      status: response.status,
      data: responseData,
      formattedNumber,
    };
  } catch (error: any) {
    console.error('[Frog API v3 SMS] Network Error:', error);
    return {
      success: false,
      status: 500,
      data: error.message || 'Network error sending SMS via Frog API v3',
      formattedNumber,
    };
  }
}

/**
 * Generates and dispatches an OTP via Frog API v3 OTP Endpoint.
 * Endpoint: POST https://frogapi.wigal.com.gh/api/v3/sms/otp/generate
 */
export async function generateFrogOtp({
  destination,
  senderId,
  expiryMinutes = 10,
  length = 6,
  messageTemplate,
}: GenerateOtpParams): Promise<WigalApiResponse> {
  const apiKey = process.env.WIGAL_API_KEY || process.env.FROG_API_KEY || process.env.WIGAL_PASSWORD;
  const username = process.env.WIGAL_USERNAME || process.env.FROG_USERNAME || 'DVLA';
  const defaultSenderId = process.env.WIGAL_SENDER_ID || process.env.FROG_SENDER_ID || 'DVLA NSS';
  const source = senderId || defaultSenderId;

  const formattedNumber = normalizePhoneForWigal(destination);

  console.log(`🔑 [Frog API v3 OTP Generate] Sending OTP to ${formattedNumber} (Sender ID: ${source})`);

  if (!apiKey || !username) {
    console.warn('⚠️ [Frog API v3 OTP] WIGAL_API_KEY or WIGAL_USERNAME not set in .env');
    return {
      success: false,
      status: 400,
      data: 'WIGAL_API_KEY and WIGAL_USERNAME must be configured in .env',
      formattedNumber,
    };
  }

  try {
    const url = 'https://frogapi.wigal.com.gh/api/v3/sms/otp/generate';
    const payload = {
      number: formattedNumber,
      expiry: expiryMinutes,
      length: length,
      messagetemplate: messageTemplate || 'Your DVLA NSS verification code is : %OTPCODE%. Valid for %EXPIRY% mins',
      type: 'NUMERIC',
      senderid: source,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'API-KEY': apiKey,
        'USERNAME': username,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseData: any = responseText;
    try {
      responseData = JSON.parse(responseText);
    } catch {}

    console.log(`[Frog API v3 OTP Generate] Response (${response.status}):`, responseText);

    const isSuccess =
      response.ok &&
      (typeof responseData !== 'object' ||
        (responseData?.status !== 'REJECTED' &&
         responseData?.status !== 'FAILED' &&
         responseData?.status !== 'ERROR' &&
         responseData?.status !== 'PERMISSION_DENIED'));

    return {
      success: Boolean(isSuccess),
      status: response.status,
      data: responseData,
      formattedNumber,
    };
  } catch (error: any) {
    console.error('[Frog API v3 OTP Generate] Error:', error);
    return {
      success: false,
      status: 500,
      data: error.message || 'Error generating OTP via Frog API v3',
      formattedNumber,
    };
  }
}

/**
 * Verifies an OTP code via Frog API v3 OTP Verify Endpoint.
 * Endpoint: POST https://frogapi.wigal.com.gh/api/v3/sms/otp/verify
 */
export async function verifyFrogOtp({
  destination,
  code,
}: VerifyOtpParams): Promise<WigalApiResponse> {
  const apiKey = process.env.WIGAL_API_KEY || process.env.FROG_API_KEY || process.env.WIGAL_PASSWORD;
  const username = process.env.WIGAL_USERNAME || process.env.FROG_USERNAME || 'DVLA';

  const formattedNumber = normalizePhoneForWigal(destination);

  console.log(`🔍 [Frog API v3 OTP Verify] Verifying code ${code} for ${formattedNumber}`);

  if (!apiKey || !username) {
    return {
      success: false,
      status: 400,
      data: 'WIGAL_API_KEY and WIGAL_USERNAME must be set in .env',
      formattedNumber,
    };
  }

  try {
    const url = 'https://frogapi.wigal.com.gh/api/v3/sms/otp/verify';
    const payload = {
      otpcode: code,
      number: formattedNumber,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'API-KEY': apiKey,
        'USERNAME': username,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseData: any = responseText;
    try {
      responseData = JSON.parse(responseText);
    } catch {}

    console.log(`[Frog API v3 OTP Verify] Response (${response.status}):`, responseText);

    const isSuccess =
      response.ok &&
      (typeof responseData !== 'object' ||
        (responseData?.status === 'SUCCESS' ||
         responseData?.status === 'ACCEPTED' ||
         responseData?.code === '1000' ||
         responseData?.message?.toLowerCase().includes('success') ||
         responseData?.message?.toLowerCase().includes('verified')));

    return {
      success: Boolean(isSuccess),
      status: response.status,
      data: responseData,
      formattedNumber,
    };
  } catch (error: any) {
    console.error('[Frog API v3 OTP Verify] Error:', error);
    return {
      success: false,
      status: 500,
      data: error.message || 'Error verifying OTP via Frog API v3',
      formattedNumber,
    };
  }
}
