import { Router } from 'express';
import { LeadController } from '../controller/lead.controller';
import { ILeadGenService } from '../../services/interfaces/lead-gen.service.interface';
import { demoRequestRateLimiter } from '../../middleware/rate-limit.middleware';

export function createLeadRouter(leadGenService: ILeadGenService): Router {
  const router = Router();
  const controller = new LeadController(leadGenService);

  router.post('/demorequest', demoRequestRateLimiter, controller.submitDemoRequest);

  return router;
}
