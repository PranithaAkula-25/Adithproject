import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';
import { useFirebaseEvents } from '@/hooks/useFirebaseEvents';
import EventCard from './EventCard';

const EnhancedEventFeed = () => {
  const { events, loading } = useFirebaseEvents();
  
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
          const aScore = (a.rsvp?.length || 0) * 2 + (a.likes?.length || 0) + (a.shareCount || 0);
          const bScore = (b.rsvp?.length || 0) * 2 + (b.likes?.length || 0) + (b.shareCount || 0);
          return bScore - aScore;
        });
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedCategory, sortBy]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading events from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search and Filter Bar */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardContent className="pt-6">
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          </div>
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
                <SelectItem value="recent">Most Recent</SelectItem>
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
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedEventFeed;