const SECRET_HEX = process.env.REACT_APP_USER_TOKEN_SECRET ?? '';

function hexToBytes(hex: string): Uint8Array {
  const buffer = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export async function encryptUserEmail(): Promise<string | null> {
  const email = localStorage.getItem('userEmail');
  if (!SECRET_HEX || !email) return null;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      hexToBytes(SECRET_HEX),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(email)
    );

    // Web Crypto AES-GCM returns ciphertext + tag (tag is last 16 bytes)
    const encryptedBytes = new Uint8Array(encrypted);
    const ciphertext = encryptedBytes.slice(0, -16);
    const tag = encryptedBytes.slice(-16);

    // Server expects: iv(12) | tag(16) | ciphertext
    const combined = new Uint8Array(12 + 16 + ciphertext.length);
    combined.set(iv, 0);
    combined.set(tag, 12);
    combined.set(ciphertext, 28);

    return btoa(Array.from(combined).map(b => String.fromCharCode(b)).join(''));
  } catch {
    return null;
  }
}
