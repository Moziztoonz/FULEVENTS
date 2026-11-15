export type Role = "student" | "organizer" | "admin";

export type Category =
  | "academic"
  | "religious"
  | "sports"
  | "social"
  | "entertainment"
  | "career"
  | "other";

export type EventStatus = "draft" | "published" | "sold_out" | "cancelled";

export type TicketType = "free" | "paid";

export type RegistrationStatus = "pending_payment" | "confirmed" | "cancelled";

export type ContactType = "whatsapp" | "phone" | "website";

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: Role;
  organization_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_blocked: number;
  created_at: string;
  updated_at: string;
}

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  organizationName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
}

export interface EventRow {
  id: string;
  organizer_id: string;
  title: string;
  category: Category;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  flyer_path: string | null;
  ticket_type: TicketType;
  price: number;
  capacity: number | null;
  registration_deadline: string | null;
  contact_type: ContactType | null;
  contact_value: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: EventStatus;
  featured: number;
  created_at: string;
  updated_at: string;
  organizer_name?: string;
  organization_name?: string | null;
  organizer_email?: string;
  registered_count?: number;
  confirmed_count?: number;
  pending_count?: number;
  checked_in_count?: number;
}

export interface RegistrationRow {
  id: string;
  event_id: string;
  user_id: string;
  ticket_code: string;
  status: RegistrationStatus;
  registered_at: string;
  payment_confirmed_at: string | null;
  cancelled_at: string | null;
  checked_in_at?: string | null;
  student_name?: string;
  student_email?: string;
  student_phone?: string | null;
  event_title?: string;
  event_date?: string;
  start_time?: string;
  venue?: string;
  ticket_type?: TicketType;
  price?: number;
  flyer_path?: string | null;
  organizer_name?: string;
  contact_type?: ContactType | null;
  contact_value?: string | null;
  contact_phone?: string | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}
