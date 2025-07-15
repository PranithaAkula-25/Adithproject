import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Bot, User, Sparkles, Calendar, MapPin, Users, Star } from 'lucide-react';
import { chatWithGemini, getPersonalizedEventRecommendations } from '@/lib/gemini';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useFirebaseEvents } from '@/hooks/useFirebaseEvents';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
  eventRecommendations?: any[];
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm CampusConnect AI, powered by Google Gemini. I can help you find events, answer questions about RSVPs, provide personalized recommendations, and assist with general campus life questions. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
      suggestions: [
        "Show me trending events",
        "What events can I RSVP to?",
        "Recommend events for me",
        "How do I create an event?",
        "Show popular events"
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { events } = useFirebaseEvents();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateEventContext = () => {
    const upcomingEvents = events.filter(event => new Date(event.eventDate) > new Date());
    const trendingEvents = events.filter(event => event.trending);
    const userRsvpEvents = user ? events.filter(event => event.rsvp?.includes(user.uid)) : [];
    const userSavedEvents = user ? events.filter(event => event.saves?.includes(user.uid)) : [];
    
    return `
    Current Events Context:
    - Total events: ${events.length}
    - Upcoming events: ${upcomingEvents.length}
    - Trending events: ${trendingEvents.length}
    - User RSVP'd events: ${userRsvpEvents.length}
    - User saved events: ${userSavedEvents.length}
    - Available categories: ${[...new Set(events.map(e => e.category))].join(', ')}
    
    Popular Events:
    ${events.sort((a, b) => (b.rsvp?.length || 0) - (a.rsvp?.length || 0)).slice(0, 3).map(event => 
      `- ${event.title} (${event.category}) on ${new Date(event.eventDate).toLocaleDateString()} at ${event.venue} - ${event.rsvp?.length || 0} attendees`
    ).join('\n')}
    
    Trending Events:
    ${trendingEvents.slice(0, 3).map(event => 
      `- ${event.title} (${event.category}) on ${new Date(event.eventDate).toLocaleDateString()} at ${event.venue}`
    ).join('\n')}
    
    Upcoming Events:
    ${upcomingEvents.slice(0, 5).map(event => 
      `- ${event.title} (${event.category}) on ${new Date(event.eventDate).toLocaleDateString()} at ${event.venue} - ${event.rsvp?.length || 0} attendees`
    ).join('\n')}
    `;
  };

  const handleSendMessage = async (message?: string) => {
    const messageText = message || inputMessage;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const userContext = user ? `User: ${user.displayName} (${user.role})` : 'Anonymous user';
      const eventContext = generateEventContext();
      const fullContext = `${userContext}\n\n${eventContext}`;
      
      // Check if user is asking for recommendations
      const isRecommendationRequest = messageText.toLowerCase().includes('recommend') || 
                                    messageText.toLowerCase().includes('suggest') ||
                                    messageText.toLowerCase().includes('for me');
      
      let response = '';
      let eventRecommendations = [];
      let suggestions = [];

      if (isRecommendationRequest && user) {
        // Get AI-powered recommendations
        const userHistory = events
          .filter(event => event.rsvp?.includes(user.uid))
          .map(event => event.title);

        const userProfile = {
          role: user.role,
          university: user.university,
          major: user.major,
          interests: user.interests || []
        };

        try {
          const recommendedTitles = await getPersonalizedEventRecommendations(
            userProfile,
            userHistory,
            events
          );

          eventRecommendations = events.filter(event => 
            recommendedTitles.includes(event.title) && 
            new Date(event.eventDate) > new Date()
          ).slice(0, 3);

          if (eventRecommendations.length > 0) {
            response = `Based on your profile and activity, here are some personalized event recommendations for you:`;
            suggestions = [
              "Tell me more about these events",
              "Show me trending events",
              "What other events are popular?",
              "How do I RSVP to these events?"
            ];
          } else {
            response = await chatWithGemini(messageText, fullContext);
          }
        } catch (error) {
          response = await chatWithGemini(messageText, fullContext);
        }
      } else {
        response = await chatWithGemini(messageText, fullContext);
        
        // Add contextual suggestions based on the query
        if (messageText.toLowerCase().includes('event')) {
          suggestions = [
            "Show me upcoming events",
            "What events are trending?",
            "How do I create an event?",
            "Show me events I can RSVP to"
          ];
        } else if (messageText.toLowerCase().includes('rsvp')) {
          suggestions = [
            "How do I cancel my RSVP?",
            "Show me my RSVP'd events",
            "What happens after I RSVP?",
            "Can I RSVP to multiple events?"
          ];
        }
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        eventRecommendations: eventRecommendations.length > 0 ? eventRecommendations : undefined
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again later or contact support for assistance.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    "Show me upcoming events",
    "What events can I RSVP to?",
    "Recommend events for me",
    "How do I create an event?",
    "Show popular events",
    "What's trending now?"
  ];

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg ${
          isOpen ? 'hidden' : 'flex'
        }`}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              CampusConnect AI
              <Sparkles className="w-4 h-4 ml-2" />
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex flex-col h-[500px] p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    <div
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          message.isUser
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {!message.isUser && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                          {message.isUser && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                          <div className="text-sm">{message.text}</div>
                        </div>
                        <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Event Recommendations */}
                    {message.eventRecommendations && message.eventRecommendations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.eventRecommendations.map((event) => (
                          <div key={event.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start space-x-3">
                              {event.imageUrl && (
                                <img 
                                  src={event.imageUrl} 
                                  alt={event.title}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-gray-900 truncate">
                                  {event.title}
                                </h4>
                                <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                                  <MapPin className="w-3 h-3" />
                                  <span>{event.venue}</span>
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {event.category}
                                  </Badge>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Users className="w-3 h-3 mr-1" />
                                    {event.rsvp?.length || 0}
                                  </div>
                                  {event.trending && (
                                    <Badge className="text-xs bg-orange-100 text-orange-800">
                                      <Star className="w-3 h-3 mr-1" />
                                      Trending
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggestions */}
                    {message.suggestions && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs h-6"
                            onClick={() => handleSendMessage(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 border-t bg-gray-50">
                <p className="text-xs text-gray-600 mb-2">Quick actions:</p>
                <div className="flex flex-wrap gap-1">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => handleSendMessage(action)}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about events, RSVPs, or anything..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by Google Gemini AI
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ChatBot;