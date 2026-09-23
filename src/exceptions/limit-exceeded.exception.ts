import { LeadGenException } from './leadgen.exception';
import { ErrorCode } from '../config/constants';

export class LimitExceededException extends LeadGenException {
  constructor(errorCode: ErrorCode) {
    super(errorCode);
    this.name = 'LimitExceededException';
  }
}