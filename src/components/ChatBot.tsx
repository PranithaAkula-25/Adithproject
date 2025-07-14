import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { chatWithGemini } from '@/lib/gemini';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useFirebaseEvents } from '@/hooks/useFirebaseEvents';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm CampusConnect AI, powered by Google Gemini. I can help you find events, answer questions about RSVPs, provide personalized recommendations, and assist with general campus life questions. What would you like to know?",
      isUser: false,
      timestamp: new Date()
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
    const userRsvpEvents = user ? events.filter(event => event.rsvp?.includes(user.uid)) : [];
    
    return `
    Current Events Context:
    - Total upcoming events: ${upcomingEvents.length}
    - User RSVP'd events: ${userRsvpEvents.length}
    - Available categories: ${[...new Set(events.map(e => e.category))].join(', ')}
    - Popular events: ${events.sort((a, b) => (b.rsvp?.length || 0) - (a.rsvp?.length || 0)).slice(0, 3).map(e => e.title).join(', ')}
    
    Recent Events:
    ${upcomingEvents.slice(0, 5).map(event => 
      `- ${event.title} (${event.category}) on ${new Date(event.eventDate).toLocaleDateString()} at ${event.venue} - ${event.rsvp?.length || 0} attendees`
    ).join('\n')}
    `;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
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
      
      const response = await chatWithGemini(inputMessage, fullContext);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
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
    "Show popular events"
  ];

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
  };

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
                  <div
                    key={message.id}
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
                      onClick={() => handleQuickAction(action)}
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
                  onClick={handleSendMessage}
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