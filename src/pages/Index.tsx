
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import EnhancedEventFeed from "@/components/EnhancedEventFeed";
import ChatBot from "@/components/ChatBot";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const handleAuthAction = (mode: 'login' | 'signup') => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      <Hero onAuthAction={handleAuthAction} />
      <section id="events" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Upcoming Events
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover exciting events happening on your campus
            </p>
          </div>
          <EnhancedEventFeed />
        </div>
      </section>
      <ChatBot />
    </div>
  );
};

export default Index;
