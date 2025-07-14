import { GoogleAuth } from 'googleapis';

const GOOGLE_CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar'];

export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export const initializeGoogleCalendar = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject('Google Calendar API can only be used in browser environment');
      return;
    }

    // Load Google API
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('auth2', () => {
        window.gapi.auth2.init({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        }).then(resolve).catch(reject);
      });
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const signInToGoogle = async () => {
  try {
    const authInstance = window.gapi.auth2.getAuthInstance();
    const user = await authInstance.signIn({
      scope: GOOGLE_CALENDAR_SCOPES.join(' ')
    });
    return user.getAuthResponse().access_token;
  } catch (error) {
    console.error('Google sign-in failed:', error);
    throw error;
  }
};

export const addEventToGoogleCalendar = async (event: CalendarEvent, accessToken: string) => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error('Failed to add event to Google Calendar');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    throw error;
  }
};

export const createGoogleCalendarLink = (event: {
  title: string;
  description?: string;
  venue?: string;
  eventDate: string;
}) => {
  const startDate = new Date(event.eventDate);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: event.description || '',
    location: event.venue || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};