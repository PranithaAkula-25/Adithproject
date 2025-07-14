
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
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/types/firebase';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'events'), 
      orderBy('eventDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsArray: Event[] = [];
      querySnapshot.forEach((doc) => {
        eventsArray.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          eventDate: doc.data().eventDate?.toDate()
        } as Event);
      });
      setEvents(eventsArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { events, loading };
};

export const useUserEvents = (userId: string) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'events'),
      where('postedBy', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsArray: Event[] = [];
      querySnapshot.forEach((doc) => {
        eventsArray.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          eventDate: doc.data().eventDate?.toDate()
        } as Event);
      });
      setEvents(eventsArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { events, loading };
};

export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt'>) => {
  await addDoc(collection(db, 'events'), {
    ...eventData,
    createdAt: new Date(),
    rsvp: [],
    likes: []
  });
};

export const updateEvent = async (eventId: string, eventData: Partial<Event>) => {
  await updateDoc(doc(db, 'events', eventId), eventData);
};

export const deleteEvent = async (eventId: string) => {
  await deleteDoc(doc(db, 'events', eventId));
};

export const rsvpToEvent = async (eventId: string, userId: string) => {
  const eventRef = doc(db, 'events', eventId);
  const eventDoc = await getDocs(query(collection(db, 'events'), where('__name__', '==', eventId)));
  
  if (!eventDoc.empty) {
    const event = eventDoc.docs[0].data() as Event;
    const currentRsvp = event.rsvp || [];
    
    if (!currentRsvp.includes(userId)) {
      await updateDoc(eventRef, {
        rsvp: [...currentRsvp, userId]
      });
    }
  }
};
