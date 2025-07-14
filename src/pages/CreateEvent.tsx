
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/FirebaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Image, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    venue: '',
    eventDate: '',
    category: '',
    imageUrl: '',
    maxAttendees: '',
    tags: ''
  });

  const categories = [
    'Technology',
    'Cultural',
    'Business',
    'Sports',
    'Academic',
    'Social',
    'Workshop',
    'Conference',
    'Competition'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    try {
      const tagsArray = eventData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const eventDoc = {
        title: eventData.title,
        description: eventData.description,
        venue: eventData.venue,
        eventDate: eventData.eventDate,
        category: eventData.category,
        imageUrl: eventData.imageUrl || null,
        maxAttendees: eventData.maxAttendees ? parseInt(eventData.maxAttendees) : null,
        tags: tagsArray,
        organizerId: user.uid,
        createdAt: serverTimestamp(),
        rsvp: [],
        likes: [],
        currentAttendees: 0,
        isPublic: true,
        clubId: null,
        googleEventId: null,
        googleCalendarLink: null
      };

      console.log('Creating event with data:', eventDoc);
      
      await addDoc(collection(db, 'events'), eventDoc);

      toast({
        title: "Success!",
        description: "Event created successfully",
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Event
            </CardTitle>
            <CardDescription>
              Fill in the details to create an engaging campus event
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter event title"
                  value={eventData.title}
                  onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              {/* Event Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event..."
                  rows={4}
                  value={eventData.description}
                  onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="venue"
                      type="text"
                      placeholder="Event location"
                      className="pl-10"
                      value={eventData.venue}
                      onChange={(e) => setEventData(prev => ({ ...prev, venue: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date & Time *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="date"
                      type="datetime-local"
                      className="pl-10"
                      value={eventData.eventDate}
                      onChange={(e) => setEventData(prev => ({ ...prev, eventDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={eventData.category}
                    onValueChange={(value) => setEventData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_attendees">Max Attendees</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="max_attendees"
                      type="number"
                      placeholder="Leave empty for unlimited"
                      className="pl-10"
                      value={eventData.maxAttendees}
                      onChange={(e) => setEventData(prev => ({ ...prev, maxAttendees: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Event Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image_url">Event Image URL</Label>
                <div className="relative">
                  <Image className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="image_url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="pl-10"
                    value={eventData.imageUrl}
                    onChange={(e) => setEventData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  type="text"
                  placeholder="Enter tags separated by commas (e.g., networking, tech, startup)"
                  value={eventData.tags}
                  onChange={(e) => setEventData(prev => ({ ...prev, tags: e.target.value }))}
                />
                <p className="text-sm text-gray-500">
                  Separate multiple tags with commas
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? 'Creating...' : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;
