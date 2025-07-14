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
}

export interface Comment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  text: string;
  createdAt: Date;
  likes: string[]; // Array of user IDs who liked this comment
  replies?: Comment[];
}

export interface EventInteraction {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  type: 'rsvp' | 'like' | 'comment' | 'share' | 'cancel_rsvp' | 'unlike';
  timestamp: Date;
  details?: string; // For comments, this would be the comment text
}

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  organizerId: string;
  organizerName: string;
  organizerPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  venue: string;
  eventDate: Date;
  endDate?: Date;
  rsvp: string[]; // Array of user IDs who RSVP'd
  likes: string[]; // Array of user IDs who liked
  comments: Comment[];
  tags: string[];
  maxAttendees?: number;
  currentAttendees: number;
  isPublic: boolean;
  rsvpOpen: boolean; // Organizers can close RSVP
  allowComments: boolean;
  googleEventId?: string;
  googleCalendarLink?: string;
  shareCount: number;
  viewCount: number;
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
  action: 'rsvp' | 'cancel_rsvp' | 'like' | 'unlike' | 'comment' | 'share' | 'view';
  timestamp: Date;
  details?: string;
}