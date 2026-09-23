import { IScoreService } from '../interfaces/score.service.interface';
import {
  IScoreDto,
  ILeadScoreRequest,
  IAccountScoreRequest,
  IRetentionScoreRequest,
} from '../../types/score.types';
import { generateScore } from './python.util';

const ScoreConstants = {
  LEAD_SCRIPT: 'lead-predict.py',
  ACCOUNT_SCRIPT: 'account-predict.py',
  RETENTION_SCRIPT: 'retention-predict.py',
  ACCOUNT_CHURN_SCRIPT: 'churnpredict.py',
  LEAD_MODEL: 'leadmodel',
  ACCOUNT_MODEL: 'accountmodel',
  RETENTION_MODEL: 'retentionmodel',
  ACCOUNT_CHURN_MODEL: 'churnmodel',
  SCORE: 'score',
} as const;

export class ScoreService implements IScoreService {
  async getLeadScore(request: ILeadScoreRequest): Promise<IScoreDto> {
    return generateScore(
      ScoreConstants.LEAD_SCRIPT,
      ScoreConstants.SCORE,
      ScoreConstants.LEAD_MODEL,
      request,
    );
  }

  async getAccountScore(request: IAccountScoreRequest): Promise<IScoreDto> {
    return generateScore(
      ScoreConstants.ACCOUNT_SCRIPT,
      ScoreConstants.SCORE,
      ScoreConstants.ACCOUNT_MODEL,
      request,
    );
  }

  async getRetentionScore(request: IRetentionScoreRequest): Promise<IScoreDto> {
    return generateScore(
      ScoreConstants.RETENTION_SCRIPT,
      ScoreConstants.SCORE,
      ScoreConstants.RETENTION_MODEL,
      request,
    );
  }

  async getAccountChurnScore(accountJson: unknown): Promise<string | null> {
    try {
      const score = await generateScore(
        ScoreConstants.ACCOUNT_CHURN_SCRIPT,
        ScoreConstants.SCORE,
        ScoreConstants.ACCOUNT_CHURN_MODEL,
        accountJson,
      );
      return String(score.score);
    } catch {
      return null;
    }
  }
}
