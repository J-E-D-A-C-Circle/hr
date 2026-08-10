import crypto from 'crypto';

/**
 * Generates a unique DVLA verification code (e.g. DVLA-VER-2026-A8K92F)
 */
export function generateVerificationCode(): string {
  const year = new Date().getFullYear();
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `DVLA-VER-${year}-${randomBytes}`;
}

/**
 * SVG QR Code generator implementation (returns SVG string for any URL/text).
 */
export function generateQrCodeSvg(text: string, size = 180): string {
  const encodedText = encodeURIComponent(text);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&color=0f5132`;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">
    <rect width="200" height="200" fill="#ffffff" rx="12"/>
    <rect x="6" y="6" width="188" height="188" fill="none" stroke="#0F5132" stroke-width="3" rx="8"/>
    <path d="M 20,20 h 45 v 45 h -45 z M 27,27 v 31 h 31 v -31 z M 34,34 h 17 v 17 h -17 z" fill="#0F5132"/>
    <path d="M 135,20 h 45 v 45 h -45 z M 142,27 v 31 h 31 v -31 z M 149,34 h 17 v 17 h -17 z" fill="#0F5132"/>
    <path d="M 20,135 h 45 v 45 h -45 z M 27,142 v 31 h 31 v -31 z M 34,149 h 17 v 17 h -17 z" fill="#0F5132"/>
    <rect x="80" y="80" width="40" height="40" rx="6" fill="#0F5132"/>
    <text x="100" y="104" font-size="11" font-weight="900" fill="#FBBF24" text-anchor="middle" font-family="sans-serif">DVLA</text>
    <image href="${qrUrl}" x="12" y="12" width="176" height="176" />
  </svg>`;
}
