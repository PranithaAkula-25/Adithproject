
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/types/firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role: 'member' | 'organizer') => Promise<{ needsVerification?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up Firebase auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid);
      
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        
        // Get additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data from Firestore:', userData);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || undefined,
              role: userData.role || 'member',
              createdAt: userData.createdAt?.toDate() || new Date(),
              university: userData.university,
              major: userData.major,
              graduationYear: userData.graduationYear
            });
          } else {
            console.log('No user document found in Firestore, creating default user');
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || undefined,
              role: 'member',
              createdAt: new Date()
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Still allow sign in even if Firestore fails
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || undefined,
            role: 'member',
            createdAt: new Date()
          });
        }
      } else {
        console.log('No authenticated user');
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in user:', email);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.uid);
      
      // Show warning if email is not verified, but don't prevent sign in
      if (!result.user.emailVerified) {
        console.warn('Email not verified, but allowing sign in');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string, role: 'member' | 'organizer') => {
    console.log('Attempting to sign up user:', email);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created:', user.uid);

      // Update user profile
      await updateProfile(user, { displayName });

      // Send email verification
      await sendEmailVerification(user);
      console.log('Email verification sent');

      // Store additional user data in Firestore (with error handling)
      try {
        await setDoc(doc(db, 'users', user.uid), {
          email,
          displayName,
          role,
          createdAt: new Date(),
          photoURL: user.photoURL,
          emailVerified: false
        });

        // Store user role separately for easier querying
        await setDoc(doc(db, 'userRoles', user.uid), {
          uid: user.uid,
          role,
          createdAt: new Date()
        });

        console.log('User data stored in Firestore');
      } catch (firestoreError) {
        console.error('Error storing user data in Firestore:', firestoreError);
        // Don't throw here - user creation was successful even if Firestore fails
      }

      return { needsVerification: true };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('Signing out user');
    try {
      await firebaseSignOut(auth);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
