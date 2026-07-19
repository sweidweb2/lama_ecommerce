// User / profile / address / contact types.
// These mirror the core user-related tables in the database.

export type UUID = string;

import type { RoleValue } from "@/lib/constants/roles";

export type ProfileRole = RoleValue;

export interface Profile {
  id: UUID;
  user_id: UUID;
  full_name: string | null;
  role: ProfileRole;
  created_at: string;
  is_active: boolean;
}

export interface UserAddress {
  id: UUID;
  user_id: UUID | null;
  country: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  phone: string | null;
  is_default: boolean;
  created_at: string;
}

export type LeadStatus = "subscribed" | "unsubscribed";
export type LeadSource = "footer" | "admin" | "unknown";

export interface Lead {
  id: UUID;
  email: string;
  user_id: UUID | null;
  status: LeadStatus;
  source: LeadSource;
  unsubscribed_at: string | null;
  unsubscribe_token: string;
  created_at: string;
}

export type ContactStatus = 'new' | 'read' | 'replied' | 'resolved';

export interface ContactMessage {
  id: UUID;
  subject: string | null;
  message: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  status: ContactStatus;
  created_at: string;
}

