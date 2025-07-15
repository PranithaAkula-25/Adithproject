import { collection, addDoc, getDocs, query, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const sampleEvents = [
  {
    title: "Tech Talk: AI in Healthcare",
    description: "Join us for an insightful discussion on how artificial intelligence is revolutionizing healthcare. Learn about cutting-edge applications, ethical considerations, and future possibilities in medical AI.",
    venue: "Main Auditorium",
    eventDate: "2024-12-15T14:00:00",
    endDate: "2024-12-15T16:00:00",
    category: "Technology",
    imageUrl: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800",
    bannerUrl: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tags: ["AI", "Healthcare", "Technology", "Innovation"],
    maxAttendees: 200,
    isPublic: true,
    rsvpOpen: true,
    allowComments: true,
    rsvp: [],
    likes: [],
    saves: [],
    comments: [],
    checkedInAttendees: [],
    currentAttendees: 0,
    shareCount: 0,
    viewCount: 0,
    trending: true,
    featured: true,
    qrCode: "tech-talk-ai-healthcare-2024"
  },
  {
    title: "Cultural Night 2024",
    description: "Celebrate diversity with performances, food, and cultural exhibitions from around the world. Experience the rich tapestry of our campus community through music, dance, and traditional cuisine.",
    venue: "Student Center",
    eventDate: "2024-12-20T18:00:00",
    endDate: "2024-12-20T22:00:00",
    category: "Cultural",
    imageUrl: "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800",
    bannerUrl: "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tags: ["Cultural", "Music", "Dance", "Food", "International"],
    maxAttendees: 500,
    isPublic: true,
    rsvpOpen: true,
    allowComments: true,
    rsvp: [],
    likes: [],
    saves: [],
    comments: [],
    checkedInAttendees: [],
    currentAttendees: 0,
    shareCount: 0,
    viewCount: 0,
    trending: true,
    featured: false,
    qrCode: "cultural-night-2024"
  },
  {
    title: "Startup Pitch Competition",
    description: "Present your startup ideas to industry experts and compete for a $5000 prize. Network with entrepreneurs, investors, and fellow innovators in this exciting competition.",
    venue: "Innovation Hub",
    eventDate: "2024-12-25T10:00:00",
    endDate: "2024-12-25T17:00:00",
    category: "Business",
    imageUrl: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",
    bannerUrl: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tags: ["Startup", "Business", "Competition", "Networking", "Innovation"],
    maxAttendees: 100,
    isPublic: true,
    rsvpOpen: true,
    allowComments: true,
    rsvp: [],
    likes: [],
    saves: [],
    comments: [],
    checkedInAttendees: [],
    currentAttendees: 0,
    shareCount: 0,
    viewCount: 0,
    trending: false,
    featured: true,
    qrCode: "startup-pitch-2024"
  },
  {
    title: "Campus Coding Bootcamp",
    description: "Intensive 3-day coding workshop covering web development fundamentals. Perfect for beginners and intermediate programmers looking to enhance their skills.",
    venue: "Computer Lab A",
    eventDate: "2024-12-18T09:00:00",
    endDate: "2024-12-20T17:00:00",
    category: "Workshop",
    imageUrl: "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800",
    bannerUrl: "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tags: ["Coding", "Web Development", "Workshop", "Programming", "Skills"],
    maxAttendees: 50,
    isPublic: true,
    rsvpOpen: true,
    allowComments: true,
    rsvp: [],
    likes: [],
    saves: [],
    comments: [],
    checkedInAttendees: [],
    currentAttendees: 0,
    shareCount: 0,
    viewCount: 0,
    trending: false,
    featured: false,
    qrCode: "coding-bootcamp-2024"
  },
  {
    title: "Mental Health Awareness Seminar",
    description: "Important discussion about mental health resources, stress management, and building a supportive campus community. Join us for this crucial conversation.",
    venue: "Wellness Center",
    eventDate: "2024-12-22T15:00:00",
    endDate: "2024-12-22T17:00:00",
    category: "Academic",
    imageUrl: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800",
    bannerUrl: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tags: ["Mental Health", "Wellness", "Support", "Community", "Awareness"],
    maxAttendees: 150,
    isPublic: true,
    rsvpOpen: true,
    allowComments: true,
    rsvp: [],
    likes: [],
    saves: [],
    comments: [],
    checkedInAttendees: [],
    currentAttendees: 0,
    shareCount: 0,
    viewCount: 0,
    trending: true,
    featured: false,
    qrCode: "mental-health-seminar-2024"
  },
  {
    title: "Winter Sports Tournament",
    description: "Annual winter sports competition featuring basketball, volleyball, and indoor soccer. Come cheer for your favorite teams and enjoy the competitive spirit!",
    venue: "Sports Complex",
    eventDate: "2024-12-28T12:00:00",
    endDate: "2024-12-28T18:00:00",
    category: "Sports",
    imageUrl: "https://images.pexels.com/photos/163444/sport-treadmill-tor-route-163444.jpeg?auto=compress&cs=tinysrgb&w=800",
    bannerUrl: "https://images.pexels.com/photos/163444/sport-treadmill-tor-route-163444.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tags: ["Sports", "Tournament", "Basketball", "Competition", "Team"],
    maxAttendees: 300,
    isPublic: true,
    rsvpOpen: true,
    allowComments: true,
    rsvp: [],
    likes: [],
    saves: [],
    comments: [],
    checkedInAttendees: [],
    currentAttendees: 0,
    shareCount: 0,
    viewCount: 0,
    trending: false,
    featured: false,
    qrCode: "winter-sports-2024"
  }
];

export const initializeSampleData = async (organizerId: string, organizerName: string = 'Event Organizer') => {
  try {
    console.log('Checking if sample data initialization is needed...');
    
    // Check if events already exist
    const eventsQuery = query(collection(db, 'events'), limit(1));
    const existingEvents = await getDocs(eventsQuery);
    
    if (existingEvents.empty) {
      console.log('No events found, adding sample data...');
      
      // Add sample events
      const promises = sampleEvents.map(async (event) => {
        try {
          await addDoc(collection(db, 'events'), {
            ...event,
            organizerId,
            organizerName,
            organizerPhotoURL: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            clubId: null,
            googleEventId: null,
            googleCalendarLink: null,
            feedback: [],
            polls: []
          });
        } catch (error) {
          console.error('Error adding sample event:', error);
          throw error;
        }
      });
      
      await Promise.all(promises);
      console.log('Sample events added successfully');
      return { success: true, message: 'Sample events added' };
    } else {
      console.log('Events already exist, skipping sample data initialization');
      return { success: true, message: 'Events already exist' };
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
    return { success: false, error: error.message };
  }
};