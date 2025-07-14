
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

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  postedBy: string;
  createdAt: Date;
  category: string;
  venue: string;
  eventDate: Date;
  rsvp: string[]; // Array of user IDs who RSVP'd
  likes: string[]; // Array of user IDs who liked
  tags: string[];
  maxAttendees?: number;
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
