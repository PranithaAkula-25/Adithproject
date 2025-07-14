
-- Add likes table to store event likes
CREATE TABLE public.event_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_likes table
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view likes
CREATE POLICY "Users can view event likes" 
  ON public.event_likes 
  FOR SELECT 
  USING (true);

-- Create policy for users to like events
CREATE POLICY "Users can like events" 
  ON public.event_likes 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to unlike events
CREATE POLICY "Users can unlike events" 
  ON public.event_likes 
  FOR DELETE 
  USING (auth.uid() = user_id);
