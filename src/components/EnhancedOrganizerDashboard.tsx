import { useAuth } from "@/contexts/FirebaseAuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Calendar, 
  Users, 
  TrendingUp, 
  LogOut, 
  BarChart3, 
  Edit, 
  Trash2,
  Search,
  Download,
  Mail,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Settings,
  Activity,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirebaseEvent, useFirebaseEvents } from '@/hooks/useFirebaseEvents';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';

interface AttendeeInfo {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  rsvpDate: Date;
}

const EnhancedOrganizerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateEvent, deleteEvent } = useFirebaseEvents();
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FirebaseEvent | null>(null);
  const [attendees, setAttendees] = useState<AttendeeInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { activityLogs, loading: activityLoading } = useActivityLogs(selectedEvent?.id);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    upcomingEvents: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    avgAttendeesPerEvent: 0,
    engagementRate: 0
  });

  useEffect(() => {
    if (user) {
      console.log('Setting up organizer events listener for user:', user.uid);
      
      const q = query(
        collection(db, 'events'),
        where('organizerId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('Organizer events snapshot received, docs:', querySnapshot.size);
        const eventsArray: FirebaseEvent[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Organizer event data:', data);
          eventsArray.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || null,
            updatedAt: data.updatedAt?.toDate() || null,
            eventDate: data.eventDate?.toDate ? data.eventDate.toDate() : new Date(data.eventDate),
            rsvp: Array.isArray(data.rsvp) ? data.rsvp : [],
            likes: Array.isArray(data.likes) ? data.likes : [],
            comments: Array.isArray(data.comments) ? data.comments : [],
          } as FirebaseEvent);
        });
        
        eventsArray.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        
        console.log('Processed organizer events:', eventsArray.length);
        setEvents(eventsArray);
        
        // Calculate enhanced stats
        const totalEvents = eventsArray.length;
        const totalAttendees = eventsArray.reduce((sum, event) => sum + (event.rsvp?.length || 0), 0);
        const totalLikes = eventsArray.reduce((sum, event) => sum + (event.likes?.length || 0), 0);
        const totalComments = eventsArray.reduce((sum, event) => sum + (event.comments?.length || 0), 0);
        const totalShares = eventsArray.reduce((sum, event) => sum + (event.shareCount || 0), 0);
        const upcomingEvents = eventsArray.filter(event => new Date(event.eventDate) > new Date()).length;
        const avgAttendeesPerEvent = totalEvents > 0 ? Math.round(totalAttendees / totalEvents) : 0;
        const totalEngagement = totalLikes + totalComments + totalShares;
        const engagementRate = totalEvents > 0 ? Math.round((totalEngagement / totalEvents) * 100) / 100 : 0;
        
        setStats({
          totalEvents,
          totalAttendees,
          upcomingEvents,
          totalLikes,
          totalComments,
          totalShares,
          avgAttendeesPerEvent,
          engagementRate
        });
      }, (error) => {
        console.error('Error fetching organizer events:', error);
        toast({
          title: "Error",
          description: "Failed to load your events",
          variant: "destructive"
        });
      });

      return () => unsubscribe();
    }
  }, [user, toast]);

  const fetchEventAttendees = async (event: FirebaseEvent) => {
    if (!event.rsvp || event.rsvp.length === 0) {
      setAttendees([]);
      return;
    }

    try {
      const attendeePromises = event.rsvp.map(async (userId) => {
        const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          return {
            uid: userId,
            displayName: userData.displayName || 'Unknown User',
            email: userData.email || '',
            photoURL: userData.photoURL,
            rsvpDate: new Date() // You might want to store actual RSVP dates
          };
        }
        return null;
      });

      const attendeeResults = await Promise.all(attendeePromises);
      const validAttendees = attendeeResults.filter(attendee => attendee !== null) as AttendeeInfo[];
      setAttendees(validAttendees);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      toast({
        title: "Error",
        description: "Failed to load attendee information",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleCreateEvent = () => {
    navigate('/create-event');
  };

  const handleEditEvent = (eventId: string) => {
    toast({
      title: "Coming Soon",
      description: "Event editing functionality will be available soon",
    });
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await deleteEvent(eventId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Event deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete event",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  const handleViewEventDetails = (event: FirebaseEvent) => {
    setSelectedEvent(event);
    fetchEventAttendees(event);
  };

  const handleToggleRsvp = async (eventId: string, currentStatus: boolean) => {
    try {
      const result = await updateEvent(eventId, { rsvpOpen: !currentStatus });
      if (result.success) {
        toast({
          title: "Success",
          description: `RSVP ${!currentStatus ? 'opened' : 'closed'} for event`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update RSVP status",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update RSVP status",
        variant: "destructive"
      });
    }
  };

  const handleToggleComments = async (eventId: string, currentStatus: boolean) => {
    try {
      const result = await updateEvent(eventId, { allowComments: !currentStatus });
      if (result.success) {
        toast({
          title: "Success",
          description: `Comments ${!currentStatus ? 'enabled' : 'disabled'} for event`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update comment settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update comment settings",
        variant: "destructive"
      });
    }
  };

  const handleExportAttendees = () => {
    if (!selectedEvent || attendees.length === 0) return;

    const csvContent = [
      ['Name', 'Email', 'RSVP Date'],
      ...attendees.map(attendee => [
        attendee.displayName,
        attendee.email,
        attendee.rsvpDate.toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEvent.title}_attendees.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAttendees = attendees.filter(attendee =>
    attendee.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Organizer Dashboard
              </h1>
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                Organizer
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleCreateEvent}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
              
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.photoURL} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                    {user?.displayName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.displayName}!
          </h2>
          <p className="text-gray-600">
            Manage your events and engage with your community
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">Events created</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttendees}</div>
              <p className="text-xs text-muted-foreground">Across all events</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes + stats.totalComments}</div>
              <p className="text-xs text-muted-foreground">Likes & Comments</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendees</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgAttendeesPerEvent}</div>
              <p className="text-xs text-muted-foreground">Per event</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events">My Events</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Events</CardTitle>
                    <CardDescription>Manage and track your event performance</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No events found</p>
                    <Button 
                      onClick={handleCreateEvent}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            {new Date(event.eventDate) > new Date() && (
                              <Badge className="bg-green-100 text-green-800">Upcoming</Badge>
                            )}
                            {!event.rsvpOpen && (
                              <Badge variant="outline" className="text-red-500">RSVP Closed</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {new Date(event.eventDate).toLocaleDateString()} • {event.venue}
                          </p>
                          <div className="flex items-center space-x-4">
                            <Badge variant="secondary">
                              <Users className="w-3 h-3 mr-1" />
                              {event.rsvp?.length || 0} attendees
                            </Badge>
                            <Badge variant="outline">
                              <Heart className="w-3 h-3 mr-1" />
                              {event.likes?.length || 0} likes
                            </Badge>
                            <Badge variant="outline">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              {event.comments?.length || 0} comments
                            </Badge>
                            <Badge variant="outline">
                              <Share2 className="w-3 h-3 mr-1" />
                              {event.shareCount || 0} shares
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`rsvp-${event.id}`} className="text-sm">RSVP Open</Label>
                              <Switch
                                id={`rsvp-${event.id}`}
                                checked={event.rsvpOpen}
                                onCheckedChange={() => handleToggleRsvp(event.id, event.rsvpOpen)}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`comments-${event.id}`} className="text-sm">Comments</Label>
                              <Switch
                                id={`comments-${event.id}`}
                                checked={event.allowComments}
                                onCheckedChange={() => handleToggleComments(event.id, event.allowComments)}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewEventDetails(event)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditEvent(event.id)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id, event.title)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendees">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Event Attendees</CardTitle>
                    <CardDescription>
                      {selectedEvent 
                        ? `Attendees for "${selectedEvent.title}"` 
                        : 'Select an event to view attendees'
                      }
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedEvent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportAttendees}
                        disabled={attendees.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    )}
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search attendees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedEvent ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Select an event from the Events tab to view attendees</p>
                  </div>
                ) : filteredAttendees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No attendees found for this event</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAttendees.map((attendee) => (
                      <div key={attendee.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={attendee.photoURL} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                              {attendee.displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{attendee.displayName}</p>
                            <p className="text-sm text-gray-600">{attendee.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            RSVP'd {attendee.rsvpDate.toLocaleDateString()}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`mailto:${attendee.email}`, '_blank')}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Activity Log</span>
                </CardTitle>
                <CardDescription>
                  {selectedEvent 
                    ? `Activity for "${selectedEvent.title}"` 
                    : 'Recent activity across all your events'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading activity...</p>
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No activity found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={log.userPhotoURL} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                            {log.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">{log.userName}</span>
                            {' '}
                            {log.action === 'rsvp' && 'RSVP\'d to'}
                            {log.action === 'cancel_rsvp' && 'cancelled RSVP for'}
                            {log.action === 'like' && 'liked'}
                            {log.action === 'unlike' && 'unliked'}
                            {log.action === 'comment' && 'commented on'}
                            {log.action === 'share' && 'shared'}
                            {' '}
                            <span className="font-semibold">{log.eventTitle}</span>
                          </p>
                          {log.details && (
                            <p className="text-xs text-gray-600 mt-1">"{log.details}"</p>
                          )}
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Likes</span>
                      <span className="font-semibold text-red-600">{stats.totalLikes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Comments</span>
                      <span className="font-semibold text-blue-600">{stats.totalComments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Shares</span>
                      <span className="font-semibold text-green-600">{stats.totalShares}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Engagement Rate</span>
                      <span className="font-semibold text-purple-600">{stats.engagementRate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Upcoming Events</span>
                      <span className="font-semibold text-blue-600">{stats.upcomingEvents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Past Events</span>
                      <span className="font-semibold text-gray-600">{stats.totalEvents - stats.upcomingEvents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avg Attendees</span>
                      <span className="font-semibold text-green-600">{stats.avgAttendeesPerEvent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Attendees</span>
                      <span className="font-semibold text-purple-600">{stats.totalAttendees}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default EnhancedOrganizerDashboard;