export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  reputation: number;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  created_by: string;
  status: 'open' | 'in_progress' | 'completed';
  max_contributions: number;
  current_turn: number;
  visibility: 'public' | 'private';
  turn_duration: number;
  blind_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  story_id: string;
  author_id: string;
  content: string;
  turn_number: number;
  is_canon: boolean;
  created_at: string;
  updated_at: string;
  author?: User;
  votes_count?: number;
}

export interface Vote {
  id: string;
  contribution_id: string;
  user_id: string;
  story_id: string;
  turn_number: number;
  created_at: string;
}

export interface StoryParticipation {
  id: string;
  story_id: string;
  user_id: string;
  joined_at: string;
  has_written_current_turn: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'turn_start' | 'vote_open' | 'story_completed' | 'contribution_accepted';
  title: string;
  message: string;
  story_id?: string;
  read: boolean;
  created_at: string;
}
