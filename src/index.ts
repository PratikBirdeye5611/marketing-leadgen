import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { env } from './config/env';

import {
  getBazaarifyDB,
  getGrowthDB,
  closeDB,
} from './db/knex.client';

import { closeRedisClient, initRedis } from './cache/redis.client';

import { closeKafkaProducer } from './kafka/kafka.client';

import {
  closeAllQueues,
  publishJob,
} from './queue/queue.client';

import { createLeadRouter } from './api/routes/lead.route';

import {
  errorHandlerMiddleware,
} from './middleware/error-handler.middleware';

import {
  mdcMiddleware,
} from './middleware/mdc.middleware';

import {
  globalRateLimiter,
} from './middleware/rate-limit.middleware';

import { CryptoService } from './services/impl/crypto.service';
import { EmailService } from './services/impl/email.service';
import { GeoIPService } from './services/impl/geo-ip.service';
import { ZoomInfoService } from './services/impl/zoom-info.service';
import { ScoreService } from './services/impl/score.service';
import { ScanToolService } from './services/impl/scan-tool.service';
import { FreeToolsService } from './services/impl/free-tools.service';
import { MarketoService } from './services/impl/marketo.service';

import {
  BlacklistService,
} from './services/impl/validation/blacklist.service';

import {
  MailgunService,
} from './services/impl/validation/mailgun.service';

import {
  HunterService,
} from './services/impl/validation/hunter.service';

import {
  PhoneValidatorService,
} from './services/impl/validation/phone-validator.service';

import {
  ValidatorUtilityService,
} from './services/impl/validation/validator-utility.service';

import {
CalendarBookingService,
} from './services/impl/calendar-booking.service';

import {
  SFDCLeadOperationHelper,
} from './services/impl/sfdc-lead-operation.helper';

import {
  SFDCLeadRequestBuilder,
} from './services/impl/sfdc-lead-request.builder';

import {
  ContactRequestService,
} from './services/impl/contact-request.service';

import {
  LeadGenHelper,
} from './services/impl/lead-gen.helper';

import {
  CreateLeadService,
} from './services/impl/create-lead.service';

import {
  LeadGenService,
} from './services/impl/lead-gen.service';

import { KafkaProducer } from './kafka/kafka.producer';

import {
  BusinessRepository,
} from './repositories/bazaarify/business.repo';
import { BusinessProfileService } from './services/impl/business-profile.service';
import { BusinessSignupService } from './services/impl/business-signup.service';
import { CoreBusinessService } from './services/impl/core-business.service';
import { FreemiumService } from './services/impl/freemium.service';
import { repos } from './repositories';
import { LeadCache } from './cache/lead.cache';
import { startCreateBusinessConsumer } from './kafka/kafka-test.consumer';


async function bootstrap(): Promise<void> {

  // ─────────────────────────────────────────────────────────────
  // REDIS (connect eagerly, before anything that depends on it)
  // ─────────────────────────────────────────────────────────────

  try {
    await initRedis();
    console.log(`Redis connected and ready: ${env.redis.host}:${env.redis.port}`);
  } catch (err) {
    console.warn(
      `Redis not ready at startup (${env.redis.host}:${env.redis.port}), continuing anyway (non-fatal):`,
      (err as Error).message,
    );
  }


  // Test code for kafka consumer
  // try {
  //   await startCreateBusinessConsumer();
  //   console.log(`Kafka create-business consumer connected: ${env.kafka.brokers.join(',')}`);
  // } catch (err) {
  //   console.warn(
  //     `Kafka consumer not ready at startup (${env.kafka.brokers.join(',')}), continuing anyway (non-fatal):`,
  //     (err as Error).message,
  //   );
  // }


  // ─────────────────────────────────────────────────────────────
  // DATABASE
  // ─────────────────────────────────────────────────────────────

  const bazaarifyDb = getBazaarifyDB();
  const growthDb = getGrowthDB();


  // ─────────────────────────────────────────────────────────────
  // LEAF SERVICES
  // ─────────────────────────────────────────────────────────────

  const cryptoService = new CryptoService();
  const emailService = new EmailService();
  const geoIPService = new GeoIPService();
  const zoomInfoService = new ZoomInfoService();
  const scoreService = new ScoreService();

  
  const businessProfileService = new BusinessProfileService();
  const businessSignupService = new BusinessSignupService();
  const coreBusinessService = new CoreBusinessService();
  const freemiumService = new FreemiumService();

  const blacklistService = new BlacklistService(growthDb);

  const mailgunService = new MailgunService(growthDb);

  const hunterService = new HunterService(growthDb);

  const phoneValidatorService = new PhoneValidatorService(growthDb);

  const validatorUtilityService = new ValidatorUtilityService(growthDb, blacklistService, mailgunService, hunterService,);

  const scanToolService = new ScanToolService(
    growthDb,
    repos.growth.scanRequestV3,
    repos.growth.scanIndustryHistory,
    repos.growth.scanLimit,
    repos.growth.parameters,
    businessProfileService,
    businessSignupService,
    coreBusinessService,
    freemiumService,
    validatorUtilityService,
  );

  const leadCache = new LeadCache();

  // ─────────────────────────────────────────────────────────────
  // BAZAARIFY DB SERVICES
  // ─────────────────────────────────────────────────────────────


  const freeToolsService = new FreeToolsService(scanToolService);

  const contactRequestService = new ContactRequestService(bazaarifyDb);

  const leadGenHelper = new LeadGenHelper(bazaarifyDb, geoIPService,repos.bazaarify.aggregationSource);

  // ─────────────────────────────────────────────────────────────
  // GROWTH DB SERVICES
  // ─────────────────────────────────────────────────────────────

  const marketoService =
    new MarketoService(growthDb);


  const sfdcLeadOperationHelper =
    new SFDCLeadOperationHelper(leadCache);

  const calendarBookingService =
    new CalendarBookingService(growthDb, bazaarifyDb, sfdcLeadOperationHelper, emailService, leadCache);


  // ─────────────────────────────────────────────────────────────
  // SALESFORCE SERVICES
  // ─────────────────────────────────────────────────────────────

  const sfdcLeadRequestBuilder =
    new SFDCLeadRequestBuilder(
      sfdcLeadOperationHelper,
      leadGenHelper,
    );

  const createLeadService =
    new CreateLeadService(
      sfdcLeadOperationHelper,
      sfdcLeadRequestBuilder,
      contactRequestService,
      leadGenHelper,
      bazaarifyDb,
      leadCache
    );

      // ─────────────────────────────────────────────────────────────
  // REPOSITORIES
  // ─────────────────────────────────────────────────────────────

  const businessRepository =
    new BusinessRepository(
      bazaarifyDb,
    );

  // ─────────────────────────────────────────────────────────────
  // MAIN LEADGEN SERVICE
  // ─────────────────────────────────────────────────────────────

  const leadGenService =
    new LeadGenService(
      contactRequestService,
      validatorUtilityService,
      cryptoService,
      geoIPService,
      scoreService,
      zoomInfoService,
      leadGenHelper,
      calendarBookingService,
      freeToolsService,
      marketoService,
      createLeadService,
      emailService,
      phoneValidatorService,
      bazaarifyDb,
      growthDb,

      async (jobName, payload) => {
        await publishJob(
          jobName as any,
          payload,
        );
      },
      leadCache,
      businessRepository,
    );


  // ─────────────────────────────────────────────────────────────
  // KAFKA
  // ─────────────────────────────────────────────────────────────

  const kafkaProducer =
    new KafkaProducer();


  // ─────────────────────────────────────────────────────────────
  // EXPRESS
  // ─────────────────────────────────────────────────────────────

  const app = express();

  app.use(helmet());

  app.use(cors());

  app.use(express.json());

  app.use(
    express.urlencoded({
      extended: true,
    }),
  );

  app.use(globalRateLimiter);

  app.use(mdcMiddleware);


  // ─────────────────────────────────────────────────────────────
  // HEALTH
  // ─────────────────────────────────────────────────────────────

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'leadgen-service',
      env: env.app.nodeEnv,
    });
  });


  // ─────────────────────────────────────────────────────────────
  // ROUTES
  // ─────────────────────────────────────────────────────────────

  app.use(
    '/leadgen',
    createLeadRouter(leadGenService),
  );

  app.use(errorHandlerMiddleware);


  // ─────────────────────────────────────────────────────────────
  // START SERVER
  // ─────────────────────────────────────────────────────────────

  const server = app.listen(
    env.app.port,
    () => {
      console.log(
        `LeadGen service running on port ${env.app.port} [${env.app.nodeEnv}]`,
      );
    },
  );


  // ─────────────────────────────────────────────────────────────
  // GRACEFUL SHUTDOWN
  // ─────────────────────────────────────────────────────────────

  const shutdown = async (
    signal: string,
  ) => {

    console.log(
      `Received ${signal}, shutting down gracefully`,
    );

    server.close(async () => {

      await closeAllQueues();

      await closeKafkaProducer();

      await closeRedisClient();

      await closeDB();

      console.log(
        'Shutdown complete',
      );

      process.exit(0);
    });
  };


  process.on(
    'SIGTERM',
    () => shutdown('SIGTERM'),
  );

  process.on(
    'SIGINT',
    () => shutdown('SIGINT'),
  );
}


bootstrap().catch((err) => {

  console.error(
    'Failed to start leadgen service:',
    err,
  );

  process.exit(1);
});