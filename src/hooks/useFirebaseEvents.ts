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
  writeBatch,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { initializeSampleData } from '@/lib/sampleData';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { Event, Comment, ActivityLog } from '@/types/firebase';

export interface FirebaseEvent extends Event {
  userHasRsvpd?: boolean;
  userHasLiked?: boolean;
  userHasSaved?: boolean;
  userHasCheckedIn?: boolean;
}

export const useFirebaseEvents = (filters?: {
  category?: string;
  trending?: boolean;
  upcoming?: boolean;
  limit?: number;
}) => {
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    console.log('Setting up Firebase events listener with filters:', filters);
    setError(null);
    
    let q = query(
      collection(db, 'events'),
      where('isPublic', '==', true)
    );

    // Apply filters
    if (filters?.category && filters.category !== 'all') {
      q = query(q, where('category', '==', filters.category));
    }

    if (filters?.trending) {
      q = query(q, where('trending', '==', true));
    }

    if (filters?.upcoming) {
      q = query(q, where('eventDate', '>', new Date()));
    }

    // Add ordering and limit
    q = query(q, orderBy('createdAt', 'desc'));
    
    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    }

    const unsubscribe = onSnapshot(
      q, 
      async (querySnapshot) => {
        console.log('Firebase events snapshot received, docs:', querySnapshot.size);
        
        try {
          if (querySnapshot.empty && user && !initialized) {
            console.log('No events found, initializing sample data...');
            setInitialized(true);
            const result = await initializeSampleData(user.uid);
            if (!result.success) {
              setError('Failed to initialize sample data');
            }
            return;
          }
          
          const eventsArray: FirebaseEvent[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const event = {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              eventDate: data.eventDate?.toDate ? data.eventDate.toDate() : new Date(data.eventDate),
              endDate: data.endDate?.toDate ? data.endDate.toDate() : undefined,
              rsvp: Array.isArray(data.rsvp) ? data.rsvp : [],
              likes: Array.isArray(data.likes) ? data.likes : [],
              saves: Array.isArray(data.saves) ? data.saves : [],
              comments: Array.isArray(data.comments) ? data.comments : [],
              checkedInAttendees: Array.isArray(data.checkedInAttendees) ? data.checkedInAttendees : [],
              userHasRsvpd: user ? (data.rsvp || []).includes(user.uid) : false,
              userHasLiked: user ? (data.likes || []).includes(user.uid) : false,
              userHasSaved: user ? (data.saves || []).includes(user.uid) : false,
              userHasCheckedIn: user ? (data.checkedInAttendees || []).includes(user.uid) : false,
            } as FirebaseEvent;
            eventsArray.push(event);
          });
          
          console.log('Processed events:', eventsArray.length);
          setEvents(eventsArray);
          setError(null);
          
          // Set last document for pagination
          if (querySnapshot.docs.length > 0) {
            setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(querySnapshot.docs.length === (filters?.limit || 20));
          } else {
            setHasMore(false);
          }
          
        } catch (err) {
          console.error('Error processing events:', err);
          setError('Failed to process events data');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Firebase events listener error:', error);
        setLoading(false);
        setError('Failed to load events from database. Please check your connection and try again.');
        toast({
          title: "Database Error",
          description: "Failed to load events. Please refresh the page or try again later.",
          variant: "destructive"
        });
      }
    );

    return () => {
      console.log('Cleaning up Firebase events listener');
      unsubscribe();
    }
  }, [toast, user, initialized, filters]);

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

      // Award points for RSVP
      await awardPoints(userId, 10, 'Event RSVP');

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

      // Award points for like
      await awardPoints(userId, 5, 'Event Like');

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

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error unliking event:', error);
      return { success: false, error: error.message };
    }
  };

  const saveEvent = async (eventId: string, userId: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        return { success: false, error: 'Event not found' };
      }

      const eventData = eventDoc.data();
      
      await updateDoc(eventRef, {
        saves: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });

      // Log activity
      await logActivity(eventId, eventData.title, 'save');

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error saving event:', error);
      return { success: false, error: error.message };
    }
  };

  const unsaveEvent = async (eventId: string, userId: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        return { success: false, error: 'Event not found' };
      }

      const eventData = eventDoc.data();
      
      await updateDoc(eventRef, {
        saves: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error unsaving event:', error);
      return { success: false, error: error.message };
    }
  };

  const checkInToEvent = async (eventId: string, userId: string, qrCode?: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        return { success: false, error: 'Event not found' };
      }

      const eventData = eventDoc.data();
      
      // Verify QR code if provided
      if (qrCode && eventData.qrCode !== qrCode) {
        return { success: false, error: 'Invalid QR code' };
      }

      // Check if user is RSVP'd
      if (!eventData.rsvp?.includes(userId)) {
        return { success: false, error: 'Must RSVP to check in' };
      }

      // Check if already checked in
      if (eventData.checkedInAttendees?.includes(userId)) {
        return { success: false, error: 'Already checked in' };
      }

      await updateDoc(eventRef, {
        checkedInAttendees: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });

      // Log activity
      await logActivity(eventId, eventData.title, 'checkin');

      // Award points for check-in
      await awardPoints(userId, 20, 'Event Check-in');

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error checking in to event:', error);
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

      // Award points for comment
      await awardPoints(userId, 15, 'Event Comment');

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
        // Award points for share
        await awardPoints(user.uid, 10, 'Event Share');
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error sharing event:', error);
      return { success: false, error: error.message };
    }
  };

  const awardPoints = async (userId: string, points: number, reason: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        points: increment(points),
        updatedAt: serverTimestamp()
      });

      // Check for badge achievements
      await checkBadgeAchievements(userId);
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const checkBadgeAchievements = async (userId: string) => {
    try {
      // Implementation for badge checking logic
      // This would check user stats and award badges accordingly
    } catch (error) {
      console.error('Error checking badge achievements:', error);
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

  const loadMoreEvents = async () => {
    if (!hasMore || !lastDoc) return;

    try {
      let q = query(
        collection(db, 'events'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(filters?.limit || 20)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setHasMore(false);
        return;
      }

      const newEvents: FirebaseEvent[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const event = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          eventDate: data.eventDate?.toDate ? data.eventDate.toDate() : new Date(data.eventDate),
          endDate: data.endDate?.toDate ? data.endDate.toDate() : undefined,
          rsvp: Array.isArray(data.rsvp) ? data.rsvp : [],
          likes: Array.isArray(data.likes) ? data.likes : [],
          saves: Array.isArray(data.saves) ? data.saves : [],
          comments: Array.isArray(data.comments) ? data.comments : [],
          checkedInAttendees: Array.isArray(data.checkedInAttendees) ? data.checkedInAttendees : [],
          userHasRsvpd: user ? (data.rsvp || []).includes(user.uid) : false,
          userHasLiked: user ? (data.likes || []).includes(user.uid) : false,
          userHasSaved: user ? (data.saves || []).includes(user.uid) : false,
          userHasCheckedIn: user ? (data.checkedInAttendees || []).includes(user.uid) : false,
        } as FirebaseEvent;
        newEvents.push(event);
      });

      setEvents(prev => [...prev, ...newEvents]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === (filters?.limit || 20));

    } catch (error) {
      console.error('Error loading more events:', error);
      toast({
        title: "Error",
        description: "Failed to load more events",
        variant: "destructive"
      });
    }
  };

  return {
    events,
    loading,
    error,
    hasMore,
    rsvpToEvent,
    cancelRsvp,
    likeEvent,
    unlikeEvent,
    saveEvent,
    unsaveEvent,
    checkInToEvent,
    addComment,
    shareEvent,
    updateEvent,
    deleteEvent,
    loadMoreEvents
  };
};