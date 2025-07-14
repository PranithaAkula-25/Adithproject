
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  university TEXT,
  major TEXT,
  graduation_year INTEGER,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clubs table
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  category TEXT,
  image_url TEXT,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  organizer_id UUID REFERENCES auth.users(id),
  club_id UUID REFERENCES public.clubs(id),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event attendees table
CREATE TABLE public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rsvp_status TEXT DEFAULT 'attending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create club memberships table
CREATE TABLE public.club_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for clubs
CREATE POLICY "Anyone can view active clubs" ON public.clubs FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can create clubs" ON public.clubs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Club creators can update their clubs" ON public.clubs FOR UPDATE USING (auth.uid() = created_by);

-- Create RLS policies for events
CREATE POLICY "Anyone can view public events" ON public.events FOR SELECT USING (is_public = true);
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Event organizers can update their events" ON public.events FOR UPDATE USING (auth.uid() = organizer_id);

-- Create RLS policies for event attendees
CREATE POLICY "Users can view event attendees" ON public.event_attendees FOR SELECT USING (true);
CREATE POLICY "Users can RSVP to events" ON public.event_attendees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own RSVP" ON public.event_attendees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can cancel their RSVP" ON public.event_attendees FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for club memberships
CREATE POLICY "Anyone can view club memberships" ON public.club_memberships FOR SELECT USING (true);
CREATE POLICY "Users can join clubs" ON public.club_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clubs" ON public.club_memberships FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for clubs
INSERT INTO public.clubs (name, description, category, member_count) VALUES
('Computer Science Club', 'Connect with fellow CS students and learn about technology', 'Technology', 127),
('International Students Association', 'Cultural exchange and support for international students', 'Cultural', 234),
('Entrepreneurship Club', 'For aspiring entrepreneurs and business minds', 'Business', 156);

-- Insert sample data for events
INSERT INTO public.events (title, description, venue, event_date, category, organizer_id, tags) VALUES
('Tech Talk: AI in Healthcare', 'Join us for an insightful discussion on how artificial intelligence is revolutionizing healthcare.', 'Main Auditorium', '2024-11-15 14:00:00', 'Technology', (SELECT id FROM auth.users LIMIT 1), ARRAY['AI', 'Healthcare', 'Technology']),
('Cultural Night 2024', 'Celebrate diversity with performances, food, and cultural exhibitions from around the world.', 'Student Center', '2024-11-20 18:00:00', 'Cultural', (SELECT id FROM auth.users LIMIT 1), ARRAY['Cultural', 'Music', 'Dance']),
('Startup Pitch Competition', 'Present your startup ideas to industry experts and compete for a $5000 prize.', 'Innovation Hub', '2024-11-25 10:00:00', 'Business', (SELECT id FROM auth.users LIMIT 1), ARRAY['Startup', 'Business', 'Competition']);
