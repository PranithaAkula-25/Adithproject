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
  increment,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { initializeSampleData } from '@/lib/sampleData';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { Event, Comment, ActivityLog } from '@/types/firebase';

export interface FirebaseEvent extends Event {
  userHasRsvpd?: boolean;
  userHasLiked?: boolean;
}

export const useFirebaseEvents = () => {
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    console.log('Setting up Firebase events listener');
    
    const q = query(
      collection(db, 'events'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q, 
      async (querySnapshot) => {
        console.log('Firebase events snapshot received, docs:', querySnapshot.size);
        
        if (querySnapshot.empty && user && !initialized) {
          console.log('No events found, initializing sample data...');
          setInitialized(true);
          await initializeSampleData(user.uid);
          return;
        }
        
        const eventsArray: FirebaseEvent[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          eventsArray.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            eventDate: data.eventDate?.toDate ? data.eventDate.toDate() : new Date(data.eventDate),
            endDate: data.endDate?.toDate ? data.endDate.toDate() : undefined,
            rsvp: Array.isArray(data.rsvp) ? data.rsvp : [],
            likes: Array.isArray(data.likes) ? data.likes : [],
            comments: Array.isArray(data.comments) ? data.comments : [],
            userHasRsvpd: user ? (data.rsvp || []).includes(user.uid) : false,
            userHasLiked: user ? (data.likes || []).includes(user.uid) : false,
          } as FirebaseEvent);
        });
        
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
  }, [toast, user, initialized]);

  const logActivity = async (eventId: string, eventTitle: string, action: string, details?: string) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'activityLogs'), {
        eventId,
        eventTitle,
        userId: user.uid,
        userName: user.displayName || 'Unknown User',
        userPhotoURL: user.photoURL || null,
        action,
        timestamp: serverTimestamp(),
        details: details || null
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const rsvpToEvent = async (eventId: string, userId: string) => {
    console.log('RSVP operation started:', { eventId, userId });
    
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        console.error('Event does not exist:', eventId);
        return { success: false, error: 'Event not found' };
      }
      
      const eventData = eventDoc.data();
      const currentRsvp = Array.isArray(eventData.rsvp) ? eventData.rsvp : [];
      
      if (currentRsvp.includes(userId)) {
        console.log('User already RSVP\'d to this event');
        return { success: false, error: 'Already RSVP\'d to this event' };
      }

      if (!eventData.rsvpOpen) {
        return { success: false, error: 'RSVP is closed for this event' };
      }

      if (eventData.maxAttendees && currentRsvp.length >= eventData.maxAttendees) {
        return { success: false, error: 'Event is full' };
      }
      
      console.log('Updating RSVP in Firebase:', { eventId, userId });
      await updateDoc(eventRef, {
        rsvp: arrayUnion(userId),
        currentAttendees: increment(1),
        updatedAt: serverTimestamp()
      });

      // Log activity
      await logActivity(eventId, eventData.title, 'rsvp');

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
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        console.error('Event does not exist:', eventId);
        return { success: false, error: 'Event not found' };
      }
      
      const eventData = eventDoc.data();
      const currentRsvp = Array.isArray(eventData.rsvp) ? eventData.rsvp : [];
      
      if (!currentRsvp.includes(userId)) {
        console.log('User is not RSVP\'d to this event');
        return { success: false, error: 'Not RSVP\'d to this event' };
      }
      
      console.log('Cancelling RSVP in Firebase:', { eventId, userId });
      await updateDoc(eventRef, {
        rsvp: arrayRemove(userId),
        currentAttendees: increment(-1),
        updatedAt: serverTimestamp()
      });

      // Log activity
      await logActivity(eventId, eventData.title, 'cancel_rsvp');

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
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        return { success: false, error: 'Event not found' };
      }

      const eventData = eventDoc.data();
      
      await updateDoc(eventRef, {
        likes: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });

      // Log activity
      await logActivity(eventId, eventData.title, 'like');

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
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        return { success: false, error: 'Event not found' };
      }

      const eventData = eventDoc.data();
      
      await updateDoc(eventRef, {
        likes: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });

      // Log activity
      await logActivity(eventId, eventData.title, 'unlike');

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

  const addComment = async (eventId: string, userId: string, text: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        return { success: false, error: 'Event not found' };
      }

      const eventData = eventDoc.data();
      
      if (!eventData.allowComments) {
        return { success: false, error: 'Comments are disabled for this event' };
      }

      const newComment: Comment = {
        id: Date.now().toString(),
        eventId,
        userId,
        userName: user?.displayName || 'Unknown User',
        userPhotoURL: user?.photoURL,
        text,
        createdAt: new Date(),
        likes: []
      };

      await updateDoc(eventRef, {
        comments: arrayUnion(newComment),
        updatedAt: serverTimestamp()
      });

      // Log activity
      await logActivity(eventId, eventData.title, 'comment', text);

      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                comments: [...(event.comments || []), newComment]
              }
            : event
        )
      );

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }
  };

  const shareEvent = async (eventId: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        return { success: false, error: 'Event not found' };
      }

      const eventData = eventDoc.data();
      
      await updateDoc(eventRef, {
        shareCount: increment(1),
        updatedAt: serverTimestamp()
      });

      // Log activity
      if (user) {
        await logActivity(eventId, eventData.title, 'share');
      }

      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                shareCount: (event.shareCount || 0) + 1
              }
            : event
        )
      );

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error sharing event:', error);
      return { success: false, error: error.message };
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error updating event:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const batch = writeBatch(db);
      
      // Delete the event
      batch.delete(doc(db, 'events', eventId));
      
      // Delete related activity logs
      const activityQuery = query(collection(db, 'activityLogs'), where('eventId', '==', eventId));
      const activityDocs = await getDocs(activityQuery);
      activityDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
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
    addComment,
    shareEvent,
    updateEvent,
    deleteEvent
  };
};