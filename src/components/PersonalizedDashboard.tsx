import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Users, Clock, TrendingUp, Star, ExternalLink } from 'lucide-react';
import { useFirebaseEvents } from '@/hooks/useFirebaseEvents';
import { useToast } from '@/hooks/use-toast';
import { createGoogleCalendarLink } from '@/lib/googleCalendar';
import { getPersonalizedEventRecommendations } from '@/lib/gemini';

const PersonalizedDashboard = () => {
  const { user } = useAuth();
  const { events, rsvpToEvent, cancelRsvp } = useFirebaseEvents();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    if (user && events.length > 0) {
      loadPersonalizedRecommendations();
    }
  }, [user, events]);

  const loadPersonalizedRecommendations = async () => {
    if (!user) return;

    setLoadingRecommendations(true);
    try {
      const userHistory = events
        .filter(event => event.rsvp?.includes(user.uid))
        .map(event => event.title);

      const userProfile = {
        role: user.role,
        university: user.university,
        major: user.major
      };

      const recommendedTitles = await getPersonalizedEventRecommendations(
        userProfile,
        userHistory,
        events
      );

      setRecommendations(recommendedTitles);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const getUpcomingEvents = () => {
    return events
      .filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate > new Date() && event.rsvp?.includes(user?.uid || '');
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 5);
  };

  const getPastEvents = () => {
    return events
      .filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate < new Date() && event.rsvp?.includes(user?.uid || '');
      })
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
      .slice(0, 5);
  };

  const getTrendingEvents = () => {
    return events
      .filter(event => new Date(event.eventDate) > new Date())
      .sort((a, b) => {
        const aEngagement = (a.rsvp?.length || 0) + (a.likes?.length || 0);
        const bEngagement = (b.rsvp?.length || 0) + (b.likes?.length || 0);
        return bEngagement - aEngagement;
      })
      .slice(0, 3);
  };

  const getRecommendedEvents = () => {
    return events.filter(event => 
      recommendations.includes(event.title) && 
      new Date(event.eventDate) > new Date() &&
      !event.rsvp?.includes(user?.uid || '')
    );
  };

  const handleRSVP = async (eventId: string) => {
    if (!user) return;

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const isRsvpd = event.rsvp?.includes(user.uid);

    try {
      if (isRsvpd) {
        const result = await cancelRsvp(eventId, user.uid);
        if (result.success) {
          toast({
            title: "RSVP Cancelled",
            description: "You've cancelled your RSVP for this event",
          });
        }
      } else {
        const result = await rsvpToEvent(eventId, user.uid);
        if (result.success) {
          toast({
            title: "RSVP Confirmed!",
            description: "You've successfully RSVP'd to this event",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update RSVP",
        variant: "destructive"
      });
    }
  };

  const handleAddToCalendar = (event: any) => {
    const calendarLink = createGoogleCalendarLink(event);
    window.open(calendarLink, '_blank');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();
  const trendingEvents = getTrendingEvents();
  const recommendedEvents = getRecommendedEvents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.photoURL} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl">
                {user.displayName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.displayName}!
              </h1>
              <p className="text-gray-600">
                Here's what's happening on your campus
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Your Upcoming Events</span>
                </CardTitle>
                <CardDescription>
                  Events you've RSVP'd to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No upcoming events</p>
                    <p className="text-sm text-gray-500">Browse events to find something interesting!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{event.venue}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddToCalendar(event)}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Add to Calendar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRSVP(event.id)}
                          >
                            Cancel RSVP
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended Events */}
            {recommendedEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span>Recommended for You</span>
                  </CardTitle>
                  <CardDescription>
                    {loadingRecommendations ? 'Loading personalized recommendations...' : 'AI-powered event suggestions based on your interests'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendedEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                            <Badge className="bg-yellow-100 text-yellow-800">Recommended</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{event.venue}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{event.rsvp?.length || 0} attending</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          onClick={() => handleRSVP(event.id)}
                        >
                          RSVP
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Events Attended</CardTitle>
                  <CardDescription>
                    Your event history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pastEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{event.venue}</span>
                          </div>
                        </div>
                        <Badge variant="outline">{event.category}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Trending Events</span>
                </CardTitle>
                <CardDescription>
                  Most popular events right now
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendingEvents.map((event, index) => (
                    <div key={event.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{event.title}</h4>
                        <p className="text-xs text-gray-600 mb-1">{event.venue}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{event.rsvp?.length || 0} attending</span>
                          <span>•</span>
                          <span>{event.likes?.length || 0} likes</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Events Attended</span>
                    <span className="font-semibold text-blue-600">{pastEvents.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Upcoming Events</span>
                    <span className="font-semibold text-purple-600">{upcomingEvents.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Events Created</span>
                    <span className="font-semibold text-green-600">
                      {events.filter(e => e.organizerId === user.uid).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedDashboard;