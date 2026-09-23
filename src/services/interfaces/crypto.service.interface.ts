export interface ICryptoService {
  encryptShared(value: string): string;

  decryptShared(value: string): string;
}
