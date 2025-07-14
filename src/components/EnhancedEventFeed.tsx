import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  BookmarkPlus, 
  ExternalLink,
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useFirebaseEvents } from '@/hooks/useFirebaseEvents';
import { useToast } from '@/hooks/use-toast';
import { createGoogleCalendarLink } from '@/lib/googleCalendar';

const EnhancedEventFeed = () => {
  const { events, loading, rsvpToEvent, cancelRsvp, likeEvent, unlikeEvent } = useFirebaseEvents();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [filteredEvents, setFilteredEvents] = useState(events);

  const categories = ['all', 'Technology', 'Cultural', 'Business', 'Sports', 'Academic', 'Social', 'Workshop'];

  useEffect(() => {
    let filtered = events.filter(event => new Date(event.eventDate) > new Date());

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        break;
      case 'popularity':
        filtered.sort((a, b) => {
          const aEngagement = (a.rsvp?.length || 0) + (a.likes?.length || 0);
          const bEngagement = (b.rsvp?.length || 0) + (b.likes?.length || 0);
          return bEngagement - aEngagement;
        });
        break;
      case 'trending':
        filtered.sort((a, b) => {
          const aScore = (a.rsvp?.length || 0) * 2 + (a.likes?.length || 0);
          const bScore = (b.rsvp?.length || 0) * 2 + (b.likes?.length || 0);
          return bScore - aScore;
        });
        break;
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedCategory, sortBy]);

  const handleRSVP = async (eventId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to RSVP to events",
        variant: "destructive"
      });
      return;
    }

    const event = events.find(event => event.id === eventId);
    if (!event) return;

    const userHasRsvpd = event.rsvp && Array.isArray(event.rsvp) && event.rsvp.includes(user.uid);
    
    try {
      if (userHasRsvpd) {
        const result = await cancelRsvp(eventId, user.uid);
        if (result.success) {
          toast({
            title: "RSVP Cancelled",
            description: "You've successfully cancelled your RSVP",
          });
        }
      } else {
        const result = await rsvpToEvent(eventId, user.uid);
        if (result.success) {
          toast({
            title: "Success!",
            description: "You've successfully RSVP'd to this event",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleLike = async (eventId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like events",
        variant: "destructive"
      });
      return;
    }

    const event = events.find(event => event.id === eventId);
    if (!event) return;

    const userHasLiked = event.likes && Array.isArray(event.likes) && event.likes.includes(user.uid);
    
    try {
      if (userHasLiked) {
        await unlikeEvent(eventId, user.uid);
      } else {
        await likeEvent(eventId, user.uid);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  };

  const handleShare = (event: any) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Event link copied to clipboard",
      });
    }
  };

  const handleAddToCalendar = (event: any) => {
    const calendarLink = createGoogleCalendarLink(event);
    window.open(calendarLink, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search and Filter Bar */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Feed */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEvents.map((event) => {
            const userHasRsvpd = user && event.rsvp && Array.isArray(event.rsvp) && event.rsvp.includes(user.uid);
            const userHasLiked = user && event.likes && Array.isArray(event.likes) && event.likes.includes(user.uid);
            const isPopular = (event.rsvp?.length || 0) + (event.likes?.length || 0) > 10;
            
            return (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                          {event.title.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">Event Organizer</p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.eventDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isPopular && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      {event.category && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {event.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  {/* Event Image */}
                  {event.imageUrl && (
                    <div className="relative mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={event.imageUrl} 
                        alt={event.title}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-black/50 text-white border-0">
                          <Users className="w-3 h-3 mr-1" />
                          {(event.rsvp && Array.isArray(event.rsvp)) ? event.rsvp.length : 0}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                    
                    <p className="text-gray-600">{event.description}</p>

                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {event.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span>{event.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`flex items-center gap-2 ${userHasLiked ? 'text-red-600' : 'text-gray-600'}`}
                        onClick={() => handleLike(event.id)}
                      >
                        <Heart className={`w-4 h-4 ${userHasLiked ? 'fill-current' : ''}`} />
                        {(event.likes && Array.isArray(event.likes)) ? event.likes.length : 0}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600">
                        <MessageCircle className="w-4 h-4" />
                        Comment
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-2 text-gray-600"
                        onClick={() => handleShare(event)}
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600"
                        onClick={() => handleAddToCalendar(event)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className={`${
                          userHasRsvpd 
                            ? 'bg-gray-500 hover:bg-gray-600' 
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                        }`}
                        onClick={() => handleRSVP(event.id)}
                        disabled={!user}
                      >
                        {!user ? 'Sign in to RSVP' : userHasRsvpd ? 'Cancel RSVP' : 'RSVP'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnhancedEventFeed;