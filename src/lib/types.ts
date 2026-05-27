export type Contact = {
  id: string;
  full_name: string;
  mobile: string | null;
  email: string | null;
  suburb: string;
  language_preference: string | null;
  main_concern: string | null;
  location_detail: string | null;
  source: string | null;
  message: string | null;
  volunteer_interest: boolean;
  membership_interest: boolean;
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
