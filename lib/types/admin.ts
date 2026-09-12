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
}

export interface Station {
  id: string;
  name: string;
  region: string;
  capacity: number;
  departments: string[];
}
