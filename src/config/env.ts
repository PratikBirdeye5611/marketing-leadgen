import dotenv from 'dotenv';
import path from 'path';

// Load environment variables BEFORE reading process.env
const nodeEnv = process.env.NODE_ENV ?? 'development';
const envFile = nodeEnv === 'development' ? '.env.local' : `.env.${nodeEnv}`;

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
  override: true,
});

export const env = {
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },

  bazaarifyDb: {
    host: process.env.BAZAARIFY_DB_HOST ?? 'localhost',
    port: parseInt(process.env.BAZAARIFY_DB_PORT || '3306', 10),
    user: process.env.BAZAARIFY_DB_USER ?? '',
    password: process.env.BAZAARIFY_DB_PASSWORD ?? '',
    name: process.env.BAZAARIFY_DB_NAME ?? '',
    pool: {
      min: parseInt(process.env.BAZAARIFY_DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.BAZAARIFY_DB_POOL_MAX || '10', 10),
    },
  },

  growthDb: {
    host: process.env.GROWTH_DB_HOST ?? 'localhost',
    port: parseInt(process.env.GROWTH_DB_PORT || '3306', 10),
    user: process.env.GROWTH_DB_USER ?? '',
    password: process.env.GROWTH_DB_PASSWORD ?? '',
    name: process.env.GROWTH_DB_NAME ?? '',
    pool: {
      min: parseInt(process.env.GROWTH_DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.GROWTH_DB_POOL_MAX || '10', 10),
    },
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD ?? '',
    ttl: {
      leadByEmail: parseInt(
        process.env.REDIS_TTL_LEAD_BY_EMAIL || '86400',
        10,
      ),
      phoneLookup: parseInt(
        process.env.REDIS_TTL_PHONE_LOOKUP || '2592000',
        10,
      ),
      geoIp: parseInt(
        process.env.REDIS_TTL_GEO_IP || '86400',
        10,
      ),
      scanReport: parseInt(
        process.env.REDIS_TTL_SCAN_REPORT || '86400',
        10,
      ),
    },
    database: Number(process.env.REDIS_DATABASE || 4),
    ssl: process.env.REDIS_SSL !== 'false',
  },

  sfdc: {
    url: process.env.SFDC_URL ?? '',
    defaultOwnerId:
      process.env.SFDC_DEFAULT_OWNER_ID ?? '005360000021APuAAM',
    loginUrl: process.env.SALESFORCE_LOGIN_URL ?? '',
  },

  bizApp: {
    url: process.env.BIZ_APP_URL ?? '',
    urlEu: process.env.BIZ_APP_URL_EU ?? '',
  },

  kafka: {
    brokers: (
      process.env.KAFKA_BROKERS ?? 'localhost:9092'
    ).split(','),
    clientId:
      process.env.KAFKA_CLIENT_ID ?? 'leadgen-service',
    groupId:
      process.env.KAFKA_GROUP_ID ?? 'leadgen-group',
  },

  mailgun: {
    uri: process.env.MAILGUN_URI ?? '',
    username: process.env.MAILGUN_USERNAME ?? 'api',
    apiKey: process.env.MAILGUN_API_KEY ?? '',
  },

  hunter: {
    uri: process.env.HUNTER_URI ?? '',
    apiKey: process.env.HUNTER_API_KEY ?? '',
  },

  geoIp: {
    apiKey: process.env.GEO_IP_API_KEY ?? '',
    baseUrl: process.env.GEO_IP_BASE_URL ?? '',
  },

  marketo: {
    baseUrl: process.env.MARKETO_BASE_URL ?? '',
    clientId: process.env.MARKETO_CLIENT_ID ?? '',
    clientSecret: process.env.MARKETO_CLIENT_SECRET ?? '',
  },

  crypto: {
    sharedAesKey: process.env.CRYPTO_SHARED_AES_KEY ?? '',
  },

  python: {
    path: process.env.PYTHON_PATH ?? '/usr/bin/python3'
  },

  email: {
    serviceUrl: process.env.EMAIL_SERVICE_URL ?? '',
  },

  tracklytics: {
    baseUrl: process.env.TRACKLYTICS_BASE_URL ?? '',
  },

  growth: {
    baseUrl: process.env.GROWTH_BASE_URL ?? '',
  },

  lead: {
    dailyLimit: parseInt(
      process.env.LEAD_DAILY_LIMIT || '5',
      10,
    ),
  },

  bam: {
    freeEndpoint:
      process.env.BAM_FREE_ENDPOINT ?? '',
    paidEndpoint:
      process.env.BAM_PAID_ENDPOINT ?? '',
    paidEndpointEu:
      process.env.BAM_PAID_ENDPOINT_EU ?? '',
  },

  presence: {
    endpoint:
      process.env.PRESENCE_ENDPOINT ?? '',
    endpointEu:
      process.env.PRESENCE_ENDPOINT_EU ?? '',
  },

  coreBusiness: {
    freeEndpoint:
      process.env.CORE_BUSINESS_FREE_ENDPOINT ?? '',
    paidEndpoint:
      process.env.CORE_BUSINESS_PAID_ENDPOINT ?? '',
    paidEndpointEu:
      process.env.CORE_BUSINESS_PAID_ENDPOINT_EU ?? '',
  },

  birdeyeApp: {
    url:
      process.env.BIRDEYE_APP_URL ?? '',
    euUrl:
      process.env.BIRDEYE_APP_EU_URL ?? '',
  },

  calendar: {
    rescheduleUrl:
      process.env.CALENDAR_RESCHEDULE_URL ?? '',
  },

  bazaarify: {
    freeServerBaseUrl:
      process.env.BAZAARIFY_FREE_SERVER_BASE_URL ?? '',
    paidServerBaseUrl:
      process.env.BAZAARIFY_PAID_SERVER_BASE_URL ?? '',
  },

  pdf: {
    apiUrl:
      process.env.PDF_API_URL ?? '',
    apiUrlEu:
      process.env.PDF_API_URL_EU ?? '',
  },

  success: {
    baseUrl:
      process.env.SUCCESS_BASE_URL ?? '',
  },

  profile: {
    baseUrl:
      process.env.PROFILE_BASE_URL ?? '',
  },
  nexus: {
  baseUrl: process.env.NEXUS_BASE_URL ?? '',
 },

   coreServices: {
    baseUrl: process.env.CORE_SERVICES_BASE_URL ?? 'http://dev-paid-core-growth-1.birdeye.internal:8080',
  },

  commonService: {
    endpoint: process.env.COMMON_SERVICE_ENDPOINT ?? 'https://devcommonservices.birdeye.com',
  },

};