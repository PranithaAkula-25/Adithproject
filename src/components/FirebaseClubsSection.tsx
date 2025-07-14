
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus } from "lucide-react";
import { useAuth } from "@/contexts/FirebaseAuthContext";
import { useFirebaseClubs } from "@/hooks/useFirebaseClubs";
import { useToast } from "@/hooks/use-toast";

const FirebaseClubsSection = () => {
  const { clubs, loading, joinClub } = useFirebaseClubs();
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

    const result = await joinClub(clubId, user.uid);
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading clubs...</p>
        </div>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-8">
        <p className="text-gray-600">No clubs available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <Card key={club.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={club.logoUrl} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                    {club.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{club.name}</CardTitle>
                  {club.category && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {club.category}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              {club.coverImageUrl && (
                <div className="relative mb-4 rounded-lg overflow-hidden">
                  <img 
                    src={club.coverImageUrl} 
                    alt={club.name}
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {club.description || "No description available"}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{club.memberCount} members</span>
                </div>
                
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => handleJoinClub(club.id)}
                  disabled={!user || club.members.includes(user?.uid || '')}
                >
                  {!user ? 'Sign in to Join' : club.members.includes(user.uid) ? 'Joined' : 'Join Club'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FirebaseClubsSection;
