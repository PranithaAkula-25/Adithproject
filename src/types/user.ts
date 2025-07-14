
export type UserRole = 'organizer' | 'member';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  university?: string;
  major?: string;
  graduation_year?: number;
  bio?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
