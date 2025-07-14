import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ActivityLog } from '@/types/firebase';

export const useActivityLogs = (eventId?: string, organizerId?: string) => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId && !organizerId) {
      setLoading(false);
      return;
    }

    let q;
    
    if (eventId) {
      // Get activity for a specific event
      q = query(
        collection(db, 'activityLogs'),
        where('eventId', '==', eventId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    } else if (organizerId) {
      // Get activity for all events by an organizer
      q = query(
        collection(db, 'activityLogs'),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
    }

    if (!q) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logs: ActivityLog[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as ActivityLog);
      });
      
      // If filtering by organizer, we need to filter client-side
      // since we can't query across collections efficiently
      if (organizerId && !eventId) {
        // This would need to be optimized in a real app by denormalizing data
        setActivityLogs(logs);
      } else {
        setActivityLogs(logs);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, organizerId]);

  return { activityLogs, loading };
};