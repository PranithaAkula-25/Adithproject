export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'member' | 'organizer';
  createdAt: Date;
  university?: string;
  major?: string;
  graduationYear?: number;
  bio?: string;
  interests?: string[];
  points?: number;
  badges?: Badge[];
  following?: string[];
  followers?: string[];
  savedEvents?: string[];
  darkMode?: boolean;
}

export interface Comment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  text: string;
  createdAt: Date;
  likes: string[];
  replies?: Comment[];
}

export interface EventInteraction {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  type: 'rsvp' | 'like' | 'comment' | 'share' | 'cancel_rsvp' | 'unlike' | 'save' | 'checkin';
  timestamp: Date;
  details?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  bannerUrl?: string;
  organizerId: string;
  organizerName: string;
  organizerPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  venue: string;
  eventDate: Date;
  endDate?: Date;
  rsvp: string[];
  likes: string[];
  comments: Comment[];
  saves: string[];
  tags: string[];
  maxAttendees?: number;
  currentAttendees: number;
  checkedInAttendees: string[];
  isPublic: boolean;
  rsvpOpen: boolean;
  allowComments: boolean;
  googleEventId?: string;
  googleCalendarLink?: string;
  shareCount: number;
  viewCount: number;
  qrCode?: string;
  feedback?: EventFeedback[];
  polls?: EventPoll[];
  trending?: boolean;
  featured?: boolean;
}

export interface EventFeedback {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface EventPoll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: Date;
  active: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'rsvp_confirmation' | 'event_reminder' | 'event_update' | 'new_follower' | 'badge_earned';
  title: string;
  message: string;
  eventId?: string;
  read: boolean;
  createdAt: Date;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;
  createdBy: string;
  members: string[];
  category: string;
  createdAt: Date;
}

export interface UserRole {
  uid: string;
  role: 'member' | 'organizer';
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  action: 'rsvp' | 'cancel_rsvp' | 'like' | 'unlike' | 'comment' | 'share' | 'view' | 'save' | 'checkin';
  timestamp: Date;
  details?: string;
}

export interface UserStats {
  eventsAttended: number;
  eventsCreated: number;
  totalLikes: number;
  totalComments: number;
  points: number;
  badges: Badge[];
  streak: number;
}