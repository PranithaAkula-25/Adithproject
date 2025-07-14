
-- Create clubs table
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  category TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0
);

-- Create club memberships table
CREATE TABLE public.club_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- Add club_id to events table
ALTER TABLE public.events ADD COLUMN club_id UUID REFERENCES public.clubs(id);

-- Add Google Calendar integration fields to events
ALTER TABLE public.events ADD COLUMN google_event_id TEXT;
ALTER TABLE public.events ADD COLUMN google_calendar_link TEXT;

-- Add Google integration fields to user profiles
ALTER TABLE public.profiles ADD COLUMN google_access_token TEXT;
ALTER TABLE public.profiles ADD COLUMN google_refresh_token TEXT;
ALTER TABLE public.profiles ADD COLUMN google_calendar_id TEXT;

-- Enable RLS on clubs table
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Create policy for clubs - anyone can view active clubs
CREATE POLICY "Anyone can view active clubs" 
  ON public.clubs 
  FOR SELECT 
  USING (is_active = true);

-- Create policy for clubs - only creators can update their clubs
CREATE POLICY "Club creators can update their clubs" 
  ON public.clubs 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- Create policy for clubs - authenticated users can create clubs
CREATE POLICY "Authenticated users can create clubs" 
  ON public.clubs 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Enable RLS on club_memberships table
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;

-- Create policy for club memberships - members can view memberships of their clubs
CREATE POLICY "Club members can view memberships" 
  ON public.club_memberships 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.club_memberships cm 
      WHERE cm.club_id = club_memberships.club_id 
      AND cm.user_id = auth.uid()
    )
  );

-- Create policy for club memberships - users can join clubs
CREATE POLICY "Users can join clubs" 
  ON public.club_memberships 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for club memberships - users can leave clubs
CREATE POLICY "Users can leave clubs" 
  ON public.club_memberships 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update member count
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clubs 
    SET member_count = member_count + 1 
    WHERE id = NEW.club_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clubs 
    SET member_count = member_count - 1 
    WHERE id = OLD.club_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update member count
CREATE TRIGGER update_club_member_count_trigger
  AFTER INSERT OR DELETE ON public.club_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_club_member_count();
