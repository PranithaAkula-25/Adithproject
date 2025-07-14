import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const chatWithGemini = async (message: string, context?: string): Promise<string> => {
  try {
    if (!API_KEY) {
      return "I'm sorry, the AI assistant is not configured. Please contact support.";
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are CampusConnect AI, a helpful assistant for a college event management platform. 
    
    Context: ${context || 'General campus event assistance'}
    
    User message: ${message}
    
    Provide a helpful, friendly response about campus events, RSVPs, clubs, or general campus life. 
    Keep responses conversational and under 150 words. If you don't know something specific, 
    suggest they contact event organizers or check the event details.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error with Gemini chat:', error);
    return "I'm having trouble processing your request right now. Please try again later or contact support.";
  }
};

export const getPersonalizedEventRecommendations = async (
  userProfile: any, 
  userHistory: string[], 
  availableEvents: any[]
): Promise<string[]> => {
  try {
    if (!API_KEY) return [];

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Based on a user's profile and event history, recommend relevant events:
    
    User Profile: ${JSON.stringify(userProfile)}
    Past Events: ${userHistory.join(', ')}
    Available Events: ${availableEvents.map(e => `${e.title} (${e.category})`).join(', ')}
    
    Return the top 5 most relevant event titles as a comma-separated list, considering:
    - User's interests and major
    - Past event attendance patterns
    - Event categories and timing
    - Diversity of recommendations
    
    Return only event titles that exist in the available events list.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim().split(',').map(title => title.trim());
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return [];
  }
};

export const generateEventTitle = async (description: string, category: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Generate a catchy, engaging title for a college event with the following details:
    Description: ${description}
    Category: ${category}
    
    The title should be:
    - Engaging and appealing to college students
    - Maximum 60 characters
    - Creative but clear about what the event is
    
    Return only the title, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating event title:', error);
    return '';
  }
};

export const generateEventSummary = async (title: string, description: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Create a compelling 2-3 sentence summary for this college event:
    Title: ${title}
    Description: ${description}
    
    The summary should:
    - Be engaging and encourage attendance
    - Highlight the main benefits or exciting aspects
    - Be suitable for social media sharing
    - Maximum 150 characters
    
    Return only the summary, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating event summary:', error);
    return '';
  }
};

export const getEventRecommendations = async (userInterests: string[], pastEvents: string[]): Promise<string[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Based on a college student's interests and past event attendance, suggest relevant event categories:
    
    User Interests: ${userInterests.join(', ')}
    Past Events Attended: ${pastEvents.join(', ')}
    
    Suggest 5 relevant event categories that this student might enjoy. Categories should be typical college event types like:
    - Academic (workshops, seminars, study groups)
    - Social (parties, mixers, game nights)
    - Sports (games, tournaments, fitness)
    - Arts (concerts, theater, art shows)
    - Career (job fairs, networking, professional development)
    - Community Service (volunteering, fundraising)
    - Cultural (cultural celebrations, international events)
    
    Return only a comma-separated list of categories, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim().split(',').map(cat => cat.trim());
  } catch (error) {
    console.error('Error getting event recommendations:', error);
    return [];
  }
};

export const answerEventQuestion = async (question: string, eventDetails: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are a helpful campus event assistant. Answer this question about an event:
    
    Question: ${question}
    Event Details: ${eventDetails}
    
    Provide a helpful, friendly response that directly answers the question. If you don't have enough information, suggest how the student can get more details (like contacting the organizer).
    
    Keep the response conversational and under 100 words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error answering event question:', error);
    return "I'm sorry, I couldn't process your question right now. Please try asking the event organizer directly.";
  }
};