import { getBazaarifyDB, getGrowthDB } from '../db/knex.client';

import { ContactRequestRepository } from './bazaarify/contact-request.repo';
import { RequestContactsRepository } from './bazaarify/request-contacts.repo';
import { RequestBusinessInfoRepository } from './bazaarify/request-business-info.repo';
import { RequestLocationRepository } from './bazaarify/request-location.repo';
import { RequestCampaignRepository } from './bazaarify/request-campaign.repo';
import { LeadsRepository } from './bazaarify/leads.repo';
import { LeadScoringRepository } from './bazaarify/lead-scoring.repo';
import { BusinessRepository } from './bazaarify/business.repo';
import { GenericEmailContactRequestRepository } from './bazaarify/generic-email-contact-request.repo';
import { IndustriesRepository } from './bazaarify/industries.repo';

import { BlacklistRepository } from './growth/blacklist.repo';
import { CalendarBookingRepository } from './growth/calendar-booking.repo';
import { CalendarSdrRulesRepository } from './growth/calendar-sdr-rules.repo';
import { LeadSourceCategoryMappingRepository } from './growth/lead-source-category-mapping.repo';
import { LeadSourceEmployeeSizeMappingRepository } from './growth/lead-source-employee-size-mapping.repo';
import { MarketoNewsletterRepository } from './growth/marketo-newsletter.repo';
import { PageUrlRepository } from './growth/page-url.repo';
import { ParametersRepository } from './growth/parameters.repo';
import { SalesRepRepository } from './growth/sales-rep.repo';
import { ScanRequestV3Repository } from './growth/scan-request-v3.repo';
import { ScanIndustryHistoryRepository } from './growth/scan-industry-history.repo';
import { ScanLimitRepository } from './growth/scan-limit.repo';
import { SfdcRoleLocationMappingRepository } from './growth/sfdc-role-location-mapping.repo';
import { AggregationSourceRepository } from './bazaarify/aggregation.repo';

const bazaarifyDb = getBazaarifyDB();
const growthDb = getGrowthDB();

export const repos = {
  bazaarify: {
    contactRequest: new ContactRequestRepository(bazaarifyDb),
    requestContacts: new RequestContactsRepository(bazaarifyDb),
    requestBusinessInfo: new RequestBusinessInfoRepository(bazaarifyDb),
    requestLocation: new RequestLocationRepository(bazaarifyDb),
    requestCampaign: new RequestCampaignRepository(bazaarifyDb),
    leads: new LeadsRepository(bazaarifyDb),
    leadScoring: new LeadScoringRepository(bazaarifyDb),
    business: new BusinessRepository(bazaarifyDb),
    genericEmailContactRequest: new GenericEmailContactRequestRepository(bazaarifyDb),
    industries: new IndustriesRepository(bazaarifyDb),
    aggregationSource: new AggregationSourceRepository(bazaarifyDb),
  },
  growth: {
    blacklist: new BlacklistRepository(growthDb),
    calendarBooking: new CalendarBookingRepository(growthDb),
    calendarSdrRules: new CalendarSdrRulesRepository(growthDb),
    leadSourceCategoryMapping: new LeadSourceCategoryMappingRepository(growthDb),
    leadSourceEmployeeSizeMapping: new LeadSourceEmployeeSizeMappingRepository(growthDb),
    marketoNewsletter: new MarketoNewsletterRepository(growthDb),
    pageUrl: new PageUrlRepository(growthDb),
    parameters: new ParametersRepository(growthDb),
    salesRep: new SalesRepRepository(growthDb),
    scanRequestV3: new ScanRequestV3Repository(growthDb),
    scanIndustryHistory: new ScanIndustryHistoryRepository(growthDb),
    scanLimit: new ScanLimitRepository(growthDb),
    sfdcRoleLocationMapping: new SfdcRoleLocationMappingRepository(growthDb),
  },
};