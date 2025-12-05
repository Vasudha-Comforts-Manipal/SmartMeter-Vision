/**
 * Simple password hashing using the Web Crypto API.
 * We use SHA-256 for hashing. In production, consider using a proper
 * password hashing library like bcrypt or argon2, but for this app
 * with client-side hashing, SHA-256 provides basic security.
 */

export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }
  
  export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password)
    return passwordHash === hash
  }