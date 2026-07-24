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

export type LionMemberSubmission = {
  id: string;
  participant_type: "current_member" | "interested_in_joining" | "activity_guest";
  first_name: string;
  middle_name: string | null;
  last_name: string;
  local_name: string | null;
  nickname: string | null;
  mobile: string | null;
  preferred_email: string | null;
  alternate_email: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  suburb: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  birth_date: string | null;
  gender: string | null;
  occupation: string | null;
  spouse_name: string | null;
  sponsor_name: string | null;
  additional_notes: string | null;
  consent: boolean;
  review_status: "new" | "reviewed" | "exported";
  created_at: string;
  updated_at: string;
};
