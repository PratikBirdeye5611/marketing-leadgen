export interface IBlacklistService {
  isBlacklisted(address: string, isDomain: boolean): Promise<boolean>;
}
