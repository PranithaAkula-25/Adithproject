
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Sparkles, UserCheck } from "lucide-react";
import { UserRole } from "@/types/user";

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void;
  selectedRole?: UserRole;
}

const RoleSelector = ({ onRoleSelect, selectedRole }: RoleSelectorProps) => {
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);

  const roles = [
    {
      type: 'member' as UserRole,
      title: 'Student Member',
      description: 'Discover and attend campus events',
      icon: Users,
      features: [
        'Browse all campus events',
        'RSVP to events',
        'Join clubs and organizations',
        'Get personalized recommendations',
        'Connect with other students'
      ],
      color: 'from-blue-500 to-purple-600'
    },
    {
      type: 'organizer' as UserRole,
      title: 'Event Organizer',
      description: 'Create and manage campus events',
      icon: Calendar,
      features: [
        'Create and publish events',
        'Manage event attendees',
        'Track event analytics',
        'Organize clubs and groups',
        'Send notifications to members'
      ],
      color: 'from-purple-500 to-pink-600'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-700 px-4 py-2">
          <Sparkles className="w-4 h-4 mr-2" />
          Choose Your Role
        </Badge>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          How do you want to use CampusConnect?
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Select your role to get started with the features that matter most to you
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Card 
            key={role.type}
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 ${
              selectedRole === role.type 
                ? 'border-blue-500 shadow-xl' 
                : hoveredRole === role.type 
                  ? 'border-blue-300' 
                  : 'border-gray-200'
            }`}
            onMouseEnter={() => setHoveredRole(role.type)}
            onMouseLeave={() => setHoveredRole(null)}
            onClick={() => onRoleSelect(role.type)}
          >
            <CardHeader className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-r ${role.color} rounded-full flex items-center justify-center mx-auto mb-4 ${
                selectedRole === role.type ? 'scale-110' : ''
              } transition-transform duration-300`}>
                <role.icon className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                {role.title}
                {selectedRole === role.type && (
                  <UserCheck className="w-5 h-5 text-green-500" />
                )}
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                {role.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                {role.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full mt-6 bg-gradient-to-r ${role.color} hover:opacity-90 text-white font-semibold`}
                onClick={() => onRoleSelect(role.type)}
              >
                {selectedRole === role.type ? 'Selected' : `Choose ${role.title}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;
