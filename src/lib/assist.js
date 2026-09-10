/**
 * Assist flow – increment local's total_assists when QR is scanned
 */
import { incrementLocalAssist as dbIncrement } from './db'

/**
 * Increment total_assists for a local by ID.
 * @param {string} localId - UUID of the local in locals_duplicate
 * @returns {Promise<{ total_assists: number }>}
 */
export async function incrementLocalAssist(localId) {
  const result = await dbIncrement(localId)
  return { total_assists: result.total_assists }
}
