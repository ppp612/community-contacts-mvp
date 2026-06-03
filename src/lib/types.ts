export type Contact = {
  id: string;
  full_name: string;
  mobile: string | null;
  email: string | null;
  suburb: string;
  address: string | null;
  language_preference: string | null;
  main_concern: string | null;
  location_detail: string | null;
  source: string | null;
  message: string | null;
  volunteer_interest: boolean;
  membership_interest: boolean;
  book_club_member: boolean;
  consent: boolean;
  follow_up_needed: boolean;
  follow_up_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Interaction = {
  id: string;
  contact_id: string;
  interaction_type: string | null;
  summary: string;
  follow_up_required: boolean;
  created_at: string;
  created_by: string | null;
};

export type Activity = {
  id: string;
  title: string;
  activity_date: string;
  location: string | null;
  suburb: string | null;
  activity_type: string | null;
  summary: string | null;
  follow_up_notes: string | null;
  important: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};
