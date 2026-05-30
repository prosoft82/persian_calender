/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Native Web Crypto API for ultra-secure AES-GCM-256 transparent encryption

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Generate a random 12-byte initialization vector (IV) for GCM mode
export function generateIV(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

// Transparently generate or retrieve the stored crypto key
export async function getOrCreateAutoKey(): Promise<CryptoKey> {
  const storedJwk = localStorage.getItem('auto_crypto_envelope_jwk');
  if (storedJwk) {
    try {
      const parsedJwk = JSON.parse(storedJwk);
      const key = await window.crypto.subtle.importKey(
        'jwk',
        parsedJwk,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );
      return key;
    } catch (e) {
      console.error('Error importing existing cryptokey, creating a new one', e);
    }
  }

  // Create new robust symmetric key
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true, // extractable so we can save it
    ['encrypt', 'decrypt']
  );

  const exported = await window.crypto.subtle.exportKey('jwk', key);
  localStorage.setItem('auto_crypto_envelope_jwk', JSON.stringify(exported));
  return key;
}

// Encrypt plain text using derived AES-GCM key
export async function encryptText(
  plainText: string,
  key: CryptoKey
): Promise<{ cipherHex: string; ivHex: string; timeTakenMs: number }> {
  const startTime = performance.now();
  
  const encoder = new TextEncoder();
  const plainBytes = encoder.encode(plainText);
  
  const iv = generateIV();

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    plainBytes
  );

  const cipherBytes = new Uint8Array(cipherBuffer);
  const endTime = performance.now();

  return {
    cipherHex: bytesToHex(cipherBytes),
    ivHex: bytesToHex(iv),
    timeTakenMs: parseFloat((endTime - startTime).toFixed(2))
  };
}

// Decrypt ciphertext using AES-GCM key and IV
export async function decryptText(
  cipherHex: string,
  ivHex: string,
  key: CryptoKey
): Promise<{ decryptedText: string; timeTakenMs: number }> {
  const startTime = performance.now();
  
  const cipherBytes = hexToBytes(cipherHex);
  const ivBytes = hexToBytes(ivHex);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes
    },
    key,
    cipherBytes
  );

  const decoder = new TextDecoder();
  const decryptedText = decoder.decode(decryptedBuffer);
  const endTime = performance.now();

  return {
    decryptedText,
    timeTakenMs: parseFloat((endTime - startTime).toFixed(2))
  };
}
