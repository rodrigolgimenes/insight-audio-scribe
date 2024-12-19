import { AuthTables } from './auth';
import { ContentTables } from './content';
import { OrganizationTables } from './organization';
import { SubscriptionTables } from './subscription';

export type Database = {
  public: {
    Tables: AuthTables & ContentTables & OrganizationTables & SubscriptionTables;
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

export type { Json } from './common';
export * from './auth';
export * from './content';
export * from './organization';
export * from './subscription';