export interface TrashLocation {
  id: string;
  latitude: number;
  longitude: number;
  created_at: string;
  created_by: string;
  status: 'active' | 'picked_up';
  description?: string;
  image_url?: string;
}

export interface UserLocation {
  id: string;
  latitude: number;
  longitude: number;
  last_updated: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  notifications_enabled: boolean;
  trash_picked_count: number;
}

export interface Event {
  id: string;
  title: string;
  location: string;
  latitude: number;
  longitude: number;
  start_time: string;
  end_time: string;
  organizer_id: string;
  organizer_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  attendees?: string[];
}
