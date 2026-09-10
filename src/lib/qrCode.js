/**
 * Generate QR code as Data URL for browser use.
 * Requires: npm install qrcode
 */
import QRCode from 'qrcode'

export async function generateQrDataUrl(text, options = {}) {
  const { width = 256, margin = 2 } = options
  try {
    return await QRCode.toDataURL(text, { width, margin })
  } catch (e) {
    throw new Error(`QR generation failed: ${e?.message || 'Unknown error'}`)
  }
}
