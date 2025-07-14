
import { useAuth } from "@/contexts/FirebaseAuthContext";
import EnhancedOrganizerDashboard from "./EnhancedOrganizerDashboard";
import PersonalizedDashboard from "./PersonalizedDashboard";

const RoleBasedDashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to access the dashboard.</p>
      </div>
    );
  }

  // Check user role and render appropriate dashboard
  if (user.role === 'organizer') {
    return <EnhancedOrganizerDashboard />;
  }

  return <PersonalizedDashboard />;
};

export default RoleBasedDashboard;
