export interface ISubIndustry {
  sub_industry_name__c?: string;
}

export interface ICrmDetail {
  name?: string;
}

export interface IAccount {
  Id?: string;
  Name?: string;
  AccountNumber?: string;
  OwnerId?: string;
  Owner?: unknown;
  Email?: string;
  BillingAddress?: unknown;
  CC_Rep__c?: string;
  CRM_Detail__r?: unknown;
  Onboard_Status__c?: string;
  Onboard_Rep__c?: string;
  Onboard_Scheduled_For__c?: string;
  Account_Score__c?: number;
  Account_Status__c?: string;
  Start_Date__c?: string;
  End_Date__c?: string;
  Social_Channels_Connected__c?: string;
  Total_Social_Channels_Connected__c?: number;
  Total_Posts_Created__c?: number;
  Total_Posts_Published__c?: number;
  Dashboard_Activity__c?: string;
  Products_Activated__c?: string;
  Website?: string;
  Birdeye_Brand_Profile__c?: string;
  Type?: string;
  Phone?: string;
}

export interface IContact {

  Id?: string;

  Title?: string;

  Salutation?: string;

  LastName?: string;

  FirstName?: string;

  Email?: string;

  Phone?: string;

  MobilePhone?: string;

  Locations_under_management__c?: string;

  Product_of_Interest__c?: string;

  Description?: string;

  Lead_Score__c?: number;

  Lead_Ranking__c?: string;

  Web_Submit_Date_Time__c?: string;

  LeadSource?: string;

  Contact_Status__c?: string;

  Contact_Stage__c?: string;

  CRO_Experiments__c?: string;

  Lead_Campaign__c?: string;

  Campaign_Name__c?: string;

  Lead_Campaign_KW__c?: string;

  Lead_Content__c?: string;

  Lead_Medium__c?: string;

  Click_URL__c?: string;

  Click_URL1__c?: string;

  Lead_URL__c?: string;

  Lead_URL1__c?: string;

  Click_Page_Type__c?: string;

  Lead_Page_Type__c?: string;

  MQL_DateTime__c?: string;

  LT_Lead_Campaign__c?: string;

  LT_Lead_Sub_Campaign__c?: string;

  LT_Lead_Campaign_KW__c?: string;

  LT_Lead_Content__c?: string;

  LT_Lead_Medium__c?: string;

  LT_Click_URL__c?: string;

  LT_Lead_URL__c?: string;

  LT_Click_Page_Type__c?: string;

  LT_Lead_Page_Type__c?: string;

  LT_MQL_Date_Time__c?: string;

  Campaign_Id__c?: string;

  Buying_Intent__c?: string;

  OwnerId?: string;

  CTA__c?: string;

  Device_name__c?: string;

  Google_Click_ID__c?: string;

  Open_Date__c?: string;

  Downgrade_Reason__c?: string;

  Department__c?: string;

  Customer__c?: boolean;

}

export interface ILead {
  Id?: string;
  Title?: string;
  Salutation?: string;
  LastName?: string;
  FirstName?: string;
  Email?: string;
  Phone?: string;
  MobilePhone?: string;

  Company?: string;
  Business_Phone__c?: string;
  Fax?: string;
  Street?: string;
  City?: string;
  State?: string;
  Country?: string;
  PostalCode?: string;
  Zip_Code__c?: string;

  Latitude?: number;
  Longitude?: number;
  Website?: string;
  Business_Location__c?: string;

  Number_of_New_Customers_Month__c?: string;
  Business_Employees__c?: string;
  NumberOfEmployees?: number;
  AnnualRevenue?: number;
  Locations_under_management__c?: string;

  Product_to_Sell__c?: string;
  Monthly_Expenditure__c?: string;
  Product_of_Interest__c?: string;

  Industry?: string;
  Industry__c?: string;
  Sub_Industry1__r?: ISubIndustry;
  Sub_Industry1__c?: string;

  Google_Review_Count__c?: number;
  Google_Rating__c?: string;
  Google_URL__c?: string;
  Scan_Business_URL__c?: string;

  Description?: string;

  Lead_Score__c?: number;
  Lead_Color_Data__c?: string;
  Score_Confidence__c?: string;
  Lead_Ranking__c?: string;

  Web_Submit_Date_Time__c?: string;
  Status?: string;
  LeadSource?: string;

  Lead_Stage__c?: string;
  Lead_Campaign__c?: string;
  Lead_Sub_Campaign__c?: string;
  Lead_Campaign_KW__c?: string;
  Lead_Content__c?: string;
  Lead_Medium__c?: string;

  Click_URL__c?: string;
  Click_URL1__c?: string;
  Lead_URL__c?: string;
  Lead_URL1__c?: string;
  Click_Page_Type__c?: string;
  Lead_Page_Type__c?: string;
  Intent__c?: string;
  MQL_DateTime__c?: string;

  FT_Lead_Campaign__c?: string;
  FT_Lead_Sub_Campaign__c?: string;
  FT_Lead_Campaign_KW__c?: string;
  FT_Lead_Content__c?: string;
  FT_Lead_Medium__c?: string;

  LT_Lead_Campaign__c?: string;
  LT_Lead_Sub_Campaign__c?: string;
  LT_Lead_Campaign_KW__c?: string;
  LT_Lead_Content__c?: string;
  LT_Lead_Medium__c?: string;
  LT_Click_URL__c?: string;
  LT_Lead_URL__c?: string;
  LT_Click_Page_Type__c?: string;
  LT_Lead_Page_Type__c?: string;
  LT_Intent__c?: string;
  LT_MQL_Date_Time__c?: string;

  Campaign_Id__c?: string;

  Buying_Intent__c?: string;
  OwnerId?: string;
  Auto_Assignment__c?: boolean;

  DOZISF__ZoomInfo_Enrich_Status__c?: string;
  DOZISF__ZoomInfo_Id__c?: string;
  DOZISF__ZoomInfo_Company_ID__c?: string;

  CRO_Experiments__c?: string;
  Original_Lead__c?: string;
  CTA__c?: string;
  Device_name__c?: string;
  Google_Click_ID__c?: string;
  Referral_Code__c?: string;

  CRM_Detail__r?: ICrmDetail;

  Customer__c?: boolean;

  Open_Date__c?: string;
  Call_Counter__c?: number;

  Visit_Id__c?: string;
  Session_Id__c?: string;
  Webchat__c?: string;

  Google_Competitor_Count__c?: number;
  User_Type__c?: string;

  Downgrade_Reason__c?: string;
  Department__c?: string;
  Seniority__c?: string;

  ConvertedContactId?: string;
  ConvertedContact?: IContact;

  Start_Date__c?: string;
  End_Date__c?: string;
  Social_Channels_Connected__c?: string;
  Total_Social_Channels_Connected__c?: number;
  Total_Posts_Created__c?: number;
  Total_Posts_Published__c?: number;
  Products_Activated__c?: string;
  Dashboard_Activity__c?: string;

  Search_AI_Report_URL__c?: string;
}

export interface IContactForAccount {
    Id?: string;
    Name?: string;
    Title?: string;
    Department__c?: string;
    Seniority_Level__c?: string;
    Account? : IAccount;
}

export interface ISFDCEvent {
  id?: string;
  Subject?: string;
  Location?: string;
  Description?: string;
  OwnerId?: string;
  StartDateTime?: string;
  EndDateTime?: string;
  WhoId?: string;
}
