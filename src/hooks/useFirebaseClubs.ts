
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc,
  where,
  arrayUnion
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export interface FirebaseClub {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  category?: string;
  createdBy: string;
  createdAt: Date;
  members: string[];
  memberCount: number;
  isActive: boolean;
}

export const useFirebaseClubs = () => {
  const [clubs, setClubs] = useState<FirebaseClub[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(
      collection(db, 'clubs'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clubsArray: FirebaseClub[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        clubsArray.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as FirebaseClub);
      });
      setClubs(clubsArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createClub = async (clubData: Omit<FirebaseClub, 'id' | 'createdAt' | 'members' | 'memberCount' | 'isActive'>) => {
    try {
      await addDoc(collection(db, 'clubs'), {
        ...clubData,
        createdAt: new Date(),
        members: [clubData.createdBy],
        memberCount: 1,
        isActive: true
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error creating club:', error);
      return { success: false, error: error.message };
    }
  };

  const joinClub = async (clubId: string, userId: string) => {
    try {
      const clubRef = doc(db, 'clubs', clubId);
      await updateDoc(clubRef, {
        members: arrayUnion(userId),
        memberCount: clubs.find(c => c.id === clubId)?.memberCount + 1 || 1
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error joining club:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    clubs,
    loading,
    createClub,
    joinClub
  };
};
