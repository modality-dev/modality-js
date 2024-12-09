import { expect, describe, test } from "@jest/globals";

import { encrypt, decrypt } from './EncryptedText.js'

describe('EncryptedText', () => {
  test('should encrypt and decrypt successfully', async () => {
      const password = "MySecretPassword123!";
      const text = "Hello, Web Crypto with password-based encryption!";

      const encrypted = await encrypt(text, password);
      const decrypted = await decrypt(encrypted, password);
      expect(decrypted).toBe(text);
  });

  test('should fail with wrong password', async () => {
      const password = "MySecretPassword123!";
      const text = "Secret message";

      const encrypted = await encrypt(text, password);
      
      await expect(decrypt(encrypted, "WrongPassword"))
          .rejects
          .toThrow("Decryption failed - invalid password or corrupted data");
  });

  test('should fail with corrupted data', async () => {
      const password = "MySecretPassword123!";
      const text = "Test message";

      const encrypted = await encrypt(text, password);
      const corrupted = encrypted.slice(0, -2);
      
      await expect(decrypt(corrupted, password))
          .rejects
          .toThrow();
  });
});