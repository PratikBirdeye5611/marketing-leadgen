import { IScoreDto, ILeadScoreRequest, IAccountScoreRequest, IRetentionScoreRequest } from '../../types/score.types';

export interface IScoreService {
  getLeadScore(request: ILeadScoreRequest): Promise<IScoreDto>;

  getAccountScore(request: IAccountScoreRequest): Promise<IScoreDto>;

  getRetentionScore(request: IRetentionScoreRequest): Promise<IScoreDto>;

  getAccountChurnScore(accountJson: unknown): Promise<string | null>;
}
