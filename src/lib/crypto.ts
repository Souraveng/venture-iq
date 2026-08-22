"use client";

// Client-side E2EE Cryptography wrapper using browser native Web Crypto API
// Uses Hybrid Encryption (RSA-OAEP for key exchange, AES-GCM for message encryption)

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate RSA-OAEP 2048-bit key pair
export async function generateE2EEKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API is not supported in this environment");
  }

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );

  return keyPair;
}

// Export Public Key to Base64 String (SPKI format)
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exported);
}

// Export Private Key to Base64 String (PKCS8 format)
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", key);
  return arrayBufferToBase64(exported);
}

// Import Public Key from Base64 String
export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  const arrayBuf = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    "spki",
    arrayBuf,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

// Import Private Key from Base64 String
export async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
  const arrayBuf = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    "pkcs8",
    arrayBuf,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

interface EncryptedPayload {
  ciphertext: string;  // AES encrypted message
  iv: string;          // AES initialization vector (base64)
  encryptedKey: string; // RSA encrypted AES key (base64)
}

// Encrypt payload using Hybrid Encryption
export async function encryptPayload(text: string, recipientPublicKeyBase64: string): Promise<EncryptedPayload> {
  const recipientPublicKey = await importPublicKey(recipientPublicKeyBase64);

  // 1. Generate a random AES-GCM 256-bit symmetric key
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Generate random IV (12 bytes for AES-GCM)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 3. Encrypt message content with AES key
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(text);
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    encodedText
  );

  // 4. Wrap (encrypt) the AES key using recipient's Public RSA Key
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    recipientPublicKey,
    exportedAesKey
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    encryptedKey: arrayBufferToBase64(encryptedKeyBuffer),
  };
}

// Decrypt payload using Hybrid Decryption
export async function decryptPayload(
  payload: EncryptedPayload,
  recipientPrivateKeyBase64: string
): Promise<string> {
  const recipientPrivateKey = await importPrivateKey(recipientPrivateKeyBase64);

  const encryptedKeyBuf = base64ToArrayBuffer(payload.encryptedKey);
  const ciphertextBuf = base64ToArrayBuffer(payload.ciphertext);
  const ivBuf = base64ToArrayBuffer(payload.iv);

  // 1. Unwrap (decrypt) the AES key using recipient's Private RSA Key
  const decryptedAesKeyRaw = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    recipientPrivateKey,
    encryptedKeyBuf
  );

  // 2. Import the decrypted AES key
  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    decryptedAesKeyRaw,
    {
      name: "AES-GCM",
    },
    true,
    ["decrypt"]
  );

  // 3. Decrypt the message content using the AES key
  const decryptedTextBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuf),
    },
    aesKey,
    ciphertextBuf
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedTextBuffer);
}
