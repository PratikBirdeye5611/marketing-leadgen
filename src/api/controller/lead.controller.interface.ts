import { Request, Response, NextFunction } from 'express';

export interface ILeadController {
  submitDemoRequest(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
}
