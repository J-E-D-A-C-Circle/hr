export interface Application {
  id: number;
  user_id?: number;
  nss_number?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  status: string;
  created_at: string;
  reviewed_at?: string | null;
  user_name?: string;
  region?: string;
  district?: string;
  posting_district?: string;
  posting_station?: string;
  posting_department?: string;
  posting_region?: string;
  institution_name?: string;
  course_program?: string;
  year_of_completion?: number;
  phone_number?: string;
}

export interface FullApplication extends Application {
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  residential_address?: string;
  service_year?: number;
  service_period_start?: string;
  service_period_end?: string;
  passport_photo?: string;
  id_card_copy?: string;
  appointment_letter?: string;
  certificates?: string;
  review_notes?: string;
  reviewer_name?: string;
  additional_info?: string | null;
}

export interface Station {
  id: string;
  name: string;
  region: string;
  capacity: number;
  departments: string[];
}

export interface ApplicantAccount {
  user_id: number;
  user_email: string;
  user_full_name: string;
  user_role: string;
  user_created_at: string;
  user_updated_at?: string;
  application_id: number | null;
  nss_number?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  application_email?: string | null;
  residential_address?: string | null;
  region?: string | null;
  district?: string | null;
  status?: string | null;
  posting_station?: string | null;
  posting_department?: string | null;
  institution_name?: string | null;
  course_program?: string | null;
  application_created_at?: string | null;
  application_updated_at?: string | null;
}
