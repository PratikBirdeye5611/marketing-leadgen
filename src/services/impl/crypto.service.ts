import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ICryptoService } from '../interfaces/crypto.service.interface';
import { env } from '../../config/env';

const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const ALGORITHM = 'aes-256-gcm';

export class CryptoService implements ICryptoService {
  private readonly key: Buffer;

  constructor() {
    this.key = Buffer.from(env.crypto.sharedAesKey, 'base64');
  }

  encryptShared(value: string): string {
    if (!value) return value;
    const iv = randomBytes(GCM_IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, encrypted, tag]);
    return combined.toString('base64');
  }

  decryptShared(value: string): string {
    if (!value) return value;
    try {
      const combined = Buffer.from(value, 'base64');
      const iv = combined.subarray(0, GCM_IV_LENGTH);
      const tag = combined.subarray(combined.length - GCM_TAG_LENGTH);
      const encrypted = combined.subarray(GCM_IV_LENGTH, combined.length - GCM_TAG_LENGTH);
      const decipher = createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(tag);
      return decipher.update(encrypted) + decipher.final('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }
}
