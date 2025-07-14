
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  where,
  getDocs,
  getDoc,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export interface FirebaseEvent {
  id: string;
  title: string;
  description: string | null;
  imageUrl?: string | null;
  organizerId: string | null;
  createdAt: Date | null;
  category: string | null;
  venue: string | null;
  eventDate: string;
  clubId?: string | null;
  googleEventId?: string | null;
  googleCalendarLink?: string | null;
  currentAttendees: number | null;
  maxAttendees?: number | null;
  isPublic: boolean | null;
  tags?: string[] | null;
  rsvp: string[];
  likes: string[];
  organizer?: {
    name: string | null;
    avatarUrl?: string | null;
  } | null;
  club?: {
    name: string;
    logoUrl?: string | null;
  } | null;
  userHasRsvpd?: boolean;
  userHasLiked?: boolean;
}

export const useFirebaseEvents = () => {
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Setting up Firebase events listener');
    
    // Simplified query - just filter by isPublic, no ordering for now
    const q = query(
      collection(db, 'events'),
      where('isPublic', '==', true)
    );

    const unsubscribe = onSnapshot(
      q, 
      (querySnapshot) => {
        console.log('Firebase events snapshot received, docs:', querySnapshot.size);
        const eventsArray: FirebaseEvent[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Event data:', data);
          eventsArray.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || null,
            // Ensure rsvp and likes are always arrays
            rsvp: Array.isArray(data.rsvp) ? data.rsvp : [],
            likes: Array.isArray(data.likes) ? data.likes : [],
          } as FirebaseEvent);
        });
        
        // Sort events by date in JavaScript instead of Firebase
        eventsArray.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        
        console.log('Processed events:', eventsArray.length);
        setEvents(eventsArray);
        setLoading(false);
      },
      (error) => {
        console.error('Firebase events listener error:', error);
        setLoading(false);
        toast({
          title: "Error loading events",
          description: "Failed to load events from database",
          variant: "destructive"
        });
      }
    );

    return () => {
      console.log('Cleaning up Firebase events listener');
      unsubscribe();
    }
  }, [toast]);

  const rsvpToEvent = async (eventId: string, userId: string) => {
    console.log('RSVP operation started:', { eventId, userId });
    
    try {
      const eventRef = doc(db, 'events', eventId);
      
      // First check if the event exists and get current data
      const eventDoc = await getDoc(eventRef);
      if (!eventDoc.exists()) {
        console.error('Event does not exist:', eventId);
        return { success: false, error: 'Event not found' };
      }
      
      const eventData = eventDoc.data();
      const currentRsvp = Array.isArray(eventData.rsvp) ? eventData.rsvp : [];
      
      // Check if user is already RSVP'd
      if (currentRsvp.includes(userId)) {
        console.log('User already RSVP\'d to this event');
        return { success: false, error: 'Already RSVP\'d to this event' };
      }
      
      console.log('Updating RSVP in Firebase:', { eventId, userId });
      await updateDoc(eventRef, {
        rsvp: arrayUnion(userId),
        currentAttendees: increment(1)
      });

      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                currentAttendees: (event.currentAttendees || 0) + 1,
                userHasRsvpd: true,
                rsvp: [...(event.rsvp || []), userId]
              }
            : event
        )
      );

      console.log('RSVP operation completed successfully');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error RSVPing to event:', error);
      return { success: false, error: error.message || 'Failed to RSVP to event' };
    }
  };

  const cancelRsvp = async (eventId: string, userId: string) => {
    console.log('Cancel RSVP operation started:', { eventId, userId });
    
    try {
      const eventRef = doc(db, 'events', eventId);
      
      // First check if the event exists and get current data
      const eventDoc = await getDoc(eventRef);
      if (!eventDoc.exists()) {
        console.error('Event does not exist:', eventId);
        return { success: false, error: 'Event not found' };
      }
      
      const eventData = eventDoc.data();
      const currentRsvp = Array.isArray(eventData.rsvp) ? eventData.rsvp : [];
      
      // Check if user is actually RSVP'd
      if (!currentRsvp.includes(userId)) {
        console.log('User is not RSVP\'d to this event');
        return { success: false, error: 'Not RSVP\'d to this event' };
      }
      
      console.log('Cancelling RSVP in Firebase:', { eventId, userId });
      await updateDoc(eventRef, {
        rsvp: arrayRemove(userId),
        currentAttendees: increment(-1)
      });

      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                currentAttendees: Math.max((event.currentAttendees || 0) - 1, 0),
                userHasRsvpd: false,
                rsvp: (event.rsvp || []).filter(id => id !== userId)
              }
            : event
        )
      );

      console.log('Cancel RSVP operation completed successfully');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error cancelling RSVP:', error);
      return { success: false, error: error.message || 'Failed to cancel RSVP' };
    }
  };

  const likeEvent = async (eventId: string, userId: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        likes: arrayUnion(userId)
      });

      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                userHasLiked: true,
                likes: [...(event.likes || []), userId]
              }
            : event
        )
      );

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error liking event:', error);
      return { success: false, error: error.message };
    }
  };

  const unlikeEvent = async (eventId: string, userId: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        likes: arrayRemove(userId)
      });

      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                userHasLiked: false,
                likes: (event.likes || []).filter(id => id !== userId)
              }
            : event
        )
      );

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error unliking event:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, 'events', eventId));
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error deleting event:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    events,
    loading,
    rsvpToEvent,
    cancelRsvp,
    likeEvent,
    unlikeEvent,
    deleteEvent
  };
};
