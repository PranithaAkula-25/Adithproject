import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  ExternalLink,
  Send,
  MoreHorizontal,
  Clock,
  Eye,
  Bookmark,
  BookmarkCheck,
  QrCode,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useFirebaseEvents, FirebaseEvent } from '@/hooks/useFirebaseEvents';
import { useToast } from '@/hooks/use-toast';
import { createGoogleCalendarLink } from '@/lib/googleCalendar';
import { formatDistanceToNow } from 'date-fns';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EventCardProps {
  event: FirebaseEvent;
}

const EventCard = ({ event }: EventCardProps) => {
  const { user } = useAuth();
  const { 
    rsvpToEvent, 
    cancelRsvp, 
    likeEvent, 
    unlikeEvent, 
    addComment, 
    shareEvent,
    saveEvent,
    unsaveEvent,
    checkInToEvent
  } = useFirebaseEvents();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleRSVP = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to RSVP to events",
        variant: "destructive"
      });
      return;
    }

    try {
      if (event.userHasRsvpd) {
        const result = await cancelRsvp(event.id, user.uid);
        if (result.success) {
          toast({
            title: "RSVP Cancelled",
            description: "You've successfully cancelled your RSVP",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to cancel RSVP",
            variant: "destructive"
          });
        }
      } else {
        const result = await rsvpToEvent(event.id, user.uid);
        if (result.success) {
          toast({
            title: "Success!",
            description: "You've successfully RSVP'd to this event",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to RSVP",
            variant: "destructive"
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

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like events",
        variant: "destructive"
      });
      return;
    }

    try {
      if (event.userHasLiked) {
        await unlikeEvent(event.id, user.uid);
      } else {
        await likeEvent(event.id, user.uid);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save events",
        variant: "destructive"
      });
      return;
    }

    try {
      if (event.userHasSaved) {
        await unsaveEvent(event.id, user.uid);
        toast({
          title: "Event unsaved",
          description: "Event removed from your saved list",
        });
      } else {
        await saveEvent(event.id, user.uid);
        toast({
          title: "Event saved",
          description: "Event added to your saved list",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive"
      });
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim()) return;

    setIsCommenting(true);
    try {
      const result = await addComment(event.id, user.uid, commentText.trim());
      if (result.success) {
        setCommentText('');
        toast({
          title: "Comment added",
          description: "Your comment has been posted",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add comment",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShare = async () => {
    try {
      const result = await shareEvent(event.id);
      if (result.success) {
        const shareData = {
          title: event.title,
          text: event.description,
          url: `${window.location.origin}/event/${event.id}`,
        };

        if (navigator.share && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(`${window.location.origin}/event/${event.id}`);
          toast({
            title: "Link copied!",
            description: "Event link copied to clipboard",
          });
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Error",
        description: "Failed to share event",
        variant: "destructive"
      });
    }
  };

  const handleAddToCalendar = () => {
    const calendarLink = createGoogleCalendarLink(event);
    window.open(calendarLink, '_blank');
  };

  const handleCheckIn = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to check in",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await checkInToEvent(event.id, user.uid, event.qrCode);
      if (result.success) {
        toast({
          title: "Checked in successfully!",
          description: "You've been checked in to this event",
        });
      } else {
        toast({
          title: "Check-in failed",
          description: result.error || "Failed to check in",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive"
      });
    }
  };

  const isEventFull = event.maxAttendees && event.currentAttendees >= event.maxAttendees;
  const isEventPast = new Date(event.eventDate) < new Date();
  const canRsvp = event.rsvpOpen && !isEventPast && !isEventFull;
  const canCheckIn = event.userHasRsvpd && !isEventPast && !event.userHasCheckedIn;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={event.organizerPhotoURL} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                {event.organizerName?.charAt(0) || event.title.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">{event.organizerName || 'Event Organizer'}</p>
              <p className="text-sm text-gray-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDistanceToNow(event.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {event.category && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {event.category}
              </Badge>
            )}
            {event.trending && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500">
                <Star className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            {event.featured && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                Featured
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleAddToCalendar}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Add to Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Event
                </DropdownMenuItem>
                {canCheckIn && (
                  <DropdownMenuItem onClick={handleCheckIn}>
                    <QrCode className="w-4 h-4 mr-2" />
                    Check In
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Event Banner/Image */}
        {(event.bannerUrl || event.imageUrl) && (
          <div className="relative mb-4 rounded-lg overflow-hidden">
            <img 
              src={event.bannerUrl || event.imageUrl} 
              alt={event.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <Badge className="bg-black/50 text-white border-0">
                <Users className="w-3 h-3 mr-1" />
                {event.currentAttendees}
                {event.maxAttendees && `/${event.maxAttendees}`}
              </Badge>
              {event.viewCount > 0 && (
                <Badge className="bg-black/50 text-white border-0">
                  <Eye className="w-3 h-3 mr-1" />
                  {event.viewCount}
                </Badge>
              )}
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

          {/* Status Indicators */}
          <div className="flex items-center space-x-2">
            {isEventPast && (
              <Badge variant="outline" className="text-gray-500">Past Event</Badge>
            )}
            {!event.rsvpOpen && (
              <Badge variant="outline" className="text-red-500">RSVP Closed</Badge>
            )}
            {isEventFull && (
              <Badge variant="outline" className="text-orange-500">Event Full</Badge>
            )}
            {event.userHasCheckedIn && (
              <Badge className="bg-green-100 text-green-800">Checked In</Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center gap-2 ${event.userHasLiked ? 'text-red-600' : 'text-gray-600'}`}
              onClick={handleLike}
            >
              <Heart className={`w-4 h-4 ${event.userHasLiked ? 'fill-current' : ''}`} />
              {event.likes?.length || 0}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 text-gray-600"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-4 h-4" />
              {event.comments?.length || 0}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 text-gray-600"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              {event.shareCount || 0}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center gap-2 ${event.userHasSaved ? 'text-blue-600' : 'text-gray-600'}`}
              onClick={handleSave}
            >
              {event.userHasSaved ? (
                <BookmarkCheck className="w-4 h-4 fill-current" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
              {event.saves?.length || 0}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              className={`${
                event.userHasRsvpd 
                  ? 'bg-gray-500 hover:bg-gray-600' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              }`}
              onClick={handleRSVP}
              disabled={!user || (!canRsvp && !event.userHasRsvpd)}
            >
              {!user ? 'Sign in to RSVP' : event.userHasRsvpd ? 'Cancel RSVP' : 'RSVP'}
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {/* Add Comment */}
            {user && event.allowComments && (
              <div className="flex space-x-3 mb-4">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.photoURL} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                    {user.displayName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleComment}
                    disabled={!commentText.trim() || isCommenting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isCommenting ? 'Posting...' : 'Comment'}
                  </Button>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {event.comments?.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.userPhotoURL} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                      {comment.userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm">{comment.userName}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Button variant="ghost" size="sm" className="text-xs text-gray-500 h-6 px-2">
                        <Heart className="w-3 h-3 mr-1" />
                        {comment.likes?.length || 0}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs text-gray-500 h-6 px-2">
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(!event.comments || event.comments.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;