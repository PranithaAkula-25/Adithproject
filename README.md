# CampusConnect - Enhanced Event Management Platform

## Overview

CampusConnect is a comprehensive, AI-powered campus event management platform that brings together students, organizers, and clubs in a social media-like experience. Built with modern web technologies and Google's ecosystem, it provides intelligent event discovery, seamless RSVP management, and engaging social features.

## ✨ Key Features

### 🎯 Core Functionality
- **Complete RSVP System**: Secure event registration with duplicate prevention
- **Personalized Dashboard**: View upcoming events, RSVP history, and recommendations
- **User Profiles**: Comprehensive profile management with activity tracking
- **Google Calendar Integration**: One-click event addition to personal calendars
- **Real-time Updates**: Live event data with Firebase Firestore

### 🤖 AI-Powered Features
- **Gemini Chatbot**: Intelligent assistant for event queries and recommendations
- **Personalized Recommendations**: AI-driven event suggestions based on user behavior
- **Smart Event Discovery**: Advanced search and filtering with AI insights

### 📱 Social Features
- **Like System**: Engage with events through likes and reactions
- **Trending Events**: Discover popular events based on engagement metrics
- **Social Sharing**: Share events across platforms
- **Activity Feed**: Social media-style event browsing experience

### 👥 Organizer Tools
- **Enhanced Dashboard**: Comprehensive event management interface
- **Attendee Management**: View, search, and export attendee lists
- **Analytics**: Track event performance and engagement metrics
- **Event Lifecycle**: Create, update, and delete events with full control

### 🏆 Gamification
- **Achievement System**: Badges for event participation and engagement
- **User Statistics**: Track attendance, creation, and club membership
- **Leaderboards**: Community engagement tracking

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive design
- **shadcn/ui** for modern UI components
- **React Router** for navigation

### Backend & Services
- **Firebase Authentication** for secure user management
- **Firestore** for real-time database
- **Firebase Storage** for file uploads
- **Google Calendar API** for calendar integration
- **Gemini AI** for intelligent features

### Development Tools
- **ESLint** for code quality
- **TypeScript** for type safety
- **React Query** for data fetching
- **Date-fns** for date manipulation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore enabled
- Google Cloud project with Calendar API enabled
- Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd campusconnect
```

2. **Install dependencies**
```bash
npm i
```

3. **Environment Setup**
```bash
cp .env.example .env
```

Fill in your environment variables:
- Firebase configuration
- Google Client ID
- Gemini API key

4. **Start development server**
```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── ChatBot.tsx      # AI-powered chatbot
│   ├── EnhancedEventFeed.tsx
│   ├── PersonalizedDashboard.tsx
│   └── UserProfile.tsx
├── contexts/            # React contexts
│   └── FirebaseAuthContext.tsx
├── hooks/               # Custom React hooks
│   ├── useFirebaseEvents.ts
│   └── useFirebaseClubs.ts
├── lib/                 # Utility libraries
│   ├── firebase.ts      # Firebase configuration
│   ├── gemini.ts        # AI integration
│   └── googleCalendar.ts # Calendar integration
├── pages/               # Route components
└── types/               # TypeScript definitions
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication (Email/Password)
3. Set up Firestore database
4. Configure security rules
5. Add your Firebase config to `.env`

### Google Calendar API
1. Enable Calendar API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized domains
4. Add client ID to `.env`

### Gemini AI
1. Get API key from Google AI Studio
2. Add to `.env` as `VITE_GEMINI_API_KEY`

## 🎨 Features in Detail

### Enhanced Event Feed
- Advanced search and filtering
- Social media-style interactions
- Real-time engagement metrics
- Trending event detection
- Google Calendar integration

### AI Chatbot
- Natural language event queries
- Personalized recommendations
- Context-aware responses
- Integration with user data

### Organizer Dashboard
- Comprehensive event analytics
- Attendee management tools
- Export functionality
- Real-time engagement tracking

### User Experience
- Responsive design for all devices
- Intuitive navigation
- Real-time notifications
- Seamless authentication flow

## 🔒 Security Features

- Firebase Authentication with email verification
- Firestore security rules
- Input validation and sanitization
- CSRF protection
- Secure API key management

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Firebase team for excellent backend services
- Google AI team for Gemini API
- shadcn for beautiful UI components
- The open-source community for amazing tools and libraries

---

**CampusConnect** - Connecting campus communities through intelligent event management.