
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Club {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  category?: string;
  created_by: string;
  created_at: string;
  member_count: number;
  is_active: boolean;
}

export const useSupabaseClubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clubs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createClub = async (clubData: Omit<Club, 'id' | 'created_at' | 'member_count' | 'is_active'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('clubs')
        .insert({
          name: clubData.name,
          description: clubData.description,
          logo_url: clubData.logo_url,
          cover_image_url: clubData.cover_image_url,
          category: clubData.category,
          created_by: user.id
        });

      if (error) throw error;
      await fetchClubs();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating club:', error);
      return { success: false, error: error.message };
    }
  };

  const joinClub = async (clubId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('club_memberships')
        .insert({
          club_id: clubId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;
      await fetchClubs();
      return { success: true };
    } catch (error: any) {
      console.error('Error joining club:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    clubs,
    loading,
    fetchClubs,
    createClub,
    joinClub
  };
};
