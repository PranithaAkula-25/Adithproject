import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar, Trophy, Settings, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseEvents } from '@/hooks/useFirebaseEvents';

const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { events } = useFirebaseEvents();
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    eventsAttended: 0,
    eventsCreated: 0,
    clubsMember: 0
  });

  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    university: '',
    major: '',
    graduationYear: '',
    bio: '',
    photoURL: user?.photoURL || ''
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserStats();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileData(prev => ({
          ...prev,
          university: userData.university || '',
          major: userData.major || '',
          graduationYear: userData.graduationYear || '',
          bio: userData.bio || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Count events user has RSVP'd to
      const userEvents = events.filter(event => 
        event.rsvp && event.rsvp.includes(user.uid)
      );

      // Count events user has created
      const createdEvents = events.filter(event => 
        event.organizerId === user.uid
      );

      // Count clubs user is member of
      const clubsQuery = query(
        collection(db, 'clubs'),
        where('members', 'array-contains', user.uid)
      );
      const clubsSnapshot = await getDocs(clubsQuery);

      setUserStats({
        eventsAttended: userEvents.length,
        eventsCreated: createdEvents.length,
        clubsMember: clubsSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        university: profileData.university,
        major: profileData.major,
        graduationYear: profileData.graduationYear ? parseInt(profileData.graduationYear) : null,
        bio: profileData.bio,
        updatedAt: new Date()
      });

      toast({
        title: "Success!",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserRsvpEvents = () => {
    return events.filter(event => 
      event.rsvp && event.rsvp.includes(user?.uid || '')
    );
  };

  const getUserCreatedEvents = () => {
    return events.filter(event => 
      event.organizerId === user?.uid
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileData.photoURL} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl">
                    {profileData.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  variant="outline"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {profileData.displayName}
                </h1>
                <p className="text-gray-600 mb-2">{profileData.email}</p>
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 capitalize">
                  {user.role}
                </Badge>
                
                {profileData.bio && (
                  <p className="text-gray-700 mt-3 max-w-md">{profileData.bio}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{userStats.eventsAttended}</div>
                  <div className="text-sm text-gray-600">Events Attended</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{userStats.eventsCreated}</div>
                  <div className="text-sm text-gray-600">Events Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{userStats.clubsMember}</div>
                  <div className="text-sm text-gray-600">Clubs Joined</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>My Events</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Achievements</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Edit Profile</span>
                </CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Input
                        id="university"
                        value={profileData.university}
                        onChange={(e) => setProfileData(prev => ({ ...prev, university: e.target.value }))}
                        placeholder="Enter your university"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="major">Major</Label>
                      <Input
                        id="major"
                        value={profileData.major}
                        onChange={(e) => setProfileData(prev => ({ ...prev, major: e.target.value }))}
                        placeholder="Enter your major"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Graduation Year</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      value={profileData.graduationYear}
                      onChange={(e) => setProfileData(prev => ({ ...prev, graduationYear: e.target.value }))}
                      placeholder="2024"
                      min="2020"
                      max="2030"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Events I'm Attending</CardTitle>
                  <CardDescription>
                    Events you've RSVP'd to
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {getUserRsvpEvents().length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No events RSVP'd yet</p>
                  ) : (
                    <div className="space-y-3">
                      {getUserRsvpEvents().map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-semibold">{event.title}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(event.eventDate).toLocaleDateString()} • {event.venue}
                            </p>
                          </div>
                          <Badge variant="outline">{event.category}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {user.role === 'organizer' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Events I've Created</CardTitle>
                    <CardDescription>
                      Events you've organized
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getUserCreatedEvents().length === 0 ? (
                      <p className="text-gray-600 text-center py-4">No events created yet</p>
                    ) : (
                      <div className="space-y-3">
                        {getUserCreatedEvents().map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-semibold">{event.title}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(event.eventDate).toLocaleDateString()} • {event.venue}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">
                                {event.rsvp?.length || 0} attendees
                              </Badge>
                              <Badge variant="outline">{event.category}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Achievements & Badges</CardTitle>
                <CardDescription>
                  Your campus engagement milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userStats.eventsAttended >= 5 && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Trophy className="w-8 h-8 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-blue-900">Event Enthusiast</h4>
                        <p className="text-sm text-blue-700">Attended 5+ events</p>
                      </div>
                    </div>
                  )}

                  {userStats.eventsCreated >= 3 && (
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <Trophy className="w-8 h-8 text-purple-600" />
                      <div>
                        <h4 className="font-semibold text-purple-900">Event Organizer</h4>
                        <p className="text-sm text-purple-700">Created 3+ events</p>
                      </div>
                    </div>
                  )}

                  {userStats.clubsMember >= 2 && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Trophy className="w-8 h-8 text-green-600" />
                      <div>
                        <h4 className="font-semibold text-green-900">Club Member</h4>
                        <p className="text-sm text-green-700">Joined 2+ clubs</p>
                      </div>
                    </div>
                  )}

                  {userStats.eventsAttended === 0 && userStats.eventsCreated === 0 && userStats.clubsMember === 0 && (
                    <div className="col-span-2 text-center py-8">
                      <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Start participating in events to earn achievements!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;