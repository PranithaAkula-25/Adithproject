import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Search,
  Filter,
  TrendingUp,
  Star,
  Clock,
  MapPin,
  Users,
  Loader2
} from 'lucide-react';
import { useFirebaseEvents } from '@/hooks/useFirebaseEvents';
import EventCard from './EventCard';

const EnhancedEventFeed = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState<'all' | 'trending' | 'upcoming' | 'featured'>('all');
  
  const { events, loading, error, hasMore, loadMoreEvents } = useFirebaseEvents({
    category: selectedCategory,
    trending: viewMode === 'trending',
    upcoming: viewMode === 'upcoming',
    limit: 10
  });
  
  const [filteredEvents, setFilteredEvents] = useState(events);
  const [loadingMore, setLoadingMore] = useState(false);

  const categories = ['all', 'Technology', 'Cultural', 'Business', 'Sports', 'Academic', 'Social', 'Workshop'];

  useEffect(() => {
    let filtered = [...events];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply view mode filters
    switch (viewMode) {
      case 'trending':
        filtered = filtered.filter(event => event.trending);
        break;
      case 'upcoming':
        filtered = filtered.filter(event => new Date(event.eventDate) > new Date());
        break;
      case 'featured':
        filtered = filtered.filter(event => event.featured);
        break;
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
      case 'saves':
        filtered.sort((a, b) => (b.saves?.length || 0) - (a.saves?.length || 0));
        break;
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedCategory, sortBy, viewMode]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      await loadMoreEvents();
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading events from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-600 mb-2">⚠️ Database Connection Error</div>
              <p className="text-red-700 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 hover:bg-red-700"
              >
                Retry Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* View Mode Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={viewMode === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('all')}
          className="flex items-center space-x-2"
        >
          <Calendar className="w-4 h-4" />
          <span>All Events</span>
        </Button>
        <Button
          variant={viewMode === 'trending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('trending')}
          className="flex items-center space-x-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Trending</span>
        </Button>
        <Button
          variant={viewMode === 'upcoming' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('upcoming')}
          className="flex items-center space-x-2"
        >
          <Clock className="w-4 h-4" />
          <span>Upcoming</span>
        </Button>
        <Button
          variant={viewMode === 'featured' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('featured')}
          className="flex items-center space-x-2"
        >
          <Star className="w-4 h-4" />
          <span>Featured</span>
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardContent className="pt-6">
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600">
              Showing {filteredEvents.length} of {events.length} events
              {viewMode !== 'all' && (
                <Badge variant="outline" className="ml-2 capitalize">
                  {viewMode}
                </Badge>
              )}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events, tags, or venues..."
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
                <SelectItem value="saves">Most Saved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Feed */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No events found' : 'No events available'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Try adjusting your search or filters' 
              : 'Check back later for upcoming events!'
            }
          </p>
          {searchTerm && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setViewMode('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-6">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="flex items-center space-x-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading more events...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Events</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{events.length}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {events.filter(e => e.trending).length}
              </div>
              <div className="text-sm text-gray-600">Trending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {events.filter(e => new Date(e.eventDate) > new Date()).length}
              </div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {events.filter(e => e.featured).length}
              </div>
              <div className="text-sm text-gray-600">Featured</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedEventFeed;