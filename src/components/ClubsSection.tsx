
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Calendar } from "lucide-react";
import { useSupabaseClubs } from "@/hooks/useSupabaseClubs";
import { useAuth } from "@/contexts/FirebaseAuthContext";
import { useToast } from "@/hooks/use-toast";

const ClubsSection = () => {
  const { clubs, loading, joinClub } = useSupabaseClubs();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleJoinClub = async (clubId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join clubs",
        variant: "destructive"
      });
      return;
    }

    const result = await joinClub(clubId);
    if (result.success) {
      toast({
        title: "Success!",
        description: "You've successfully joined the club",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to join club",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading clubs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Campus Clubs</h2>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Club
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <Card key={club.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              {club.cover_image_url && (
                <div className="relative -mx-6 -mt-6 mb-4 h-32 overflow-hidden">
                  <img 
                    src={club.cover_image_url} 
                    alt={club.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={club.logo_url} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {club.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{club.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {club.category || 'General'}
                    </Badge>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {club.member_count}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <CardDescription className="mb-4 line-clamp-3">
                {club.description || 'No description available'}
              </CardDescription>
              
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleJoinClub(club.id)}
                  disabled={!user}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Join Club
                </Button>
                <Button variant="ghost" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Events
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clubs.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Clubs Yet</h3>
          <p className="text-gray-600 mb-4">Be the first to create a club on campus!</p>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create First Club
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClubsSection;
