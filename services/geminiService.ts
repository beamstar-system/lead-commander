import { GoogleGenAI, Type } from "@google/genai";
import { Lead, WeatherCondition, ChatMessage } from '../types';

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper to generate random tech specs
const generateTechSpecs = (condition: string, weather: WeatherCondition) => {
  const pitches = ['4/12', '6/12', '8/12', '10/12', '12/12'];
  let damages: any[] = ['Hail', 'Wind', 'Thermal', 'Organic Growth'];
  
  // Weather influences damage vector probability
  if (weather === 'HAIL') damages = ['Hail', 'Hail', 'Hail', 'Wind'];
  if (weather === 'WIND') damages = ['Wind', 'Wind', 'Thermal', 'Hail'];

  const activityLevels: any[] = ['None', 'Low', 'Moderate', 'High'];
  
  return {
    surfaceArea: Math.floor(Math.random() * (3500 - 1200) + 1200),
    pitch: pitches[Math.floor(Math.random() * pitches.length)],
    damageVector: condition === 'Good' ? 'None' : damages[Math.floor(Math.random() * damages.length)],
    estimatedValue: Math.floor(Math.random() * (25000 - 12000) + 12000),
    competitorActivity: activityLevels[Math.floor(Math.random() * activityLevels.length)]
  };
};

export const fetchLeadsForRegion = async (city: string, state: string, existingCount: number, weather: WeatherCondition = 'CLEAR'): Promise<Lead[]> => {
  const model = "gemini-2.5-flash";
  
  let weatherPrompt = "";
  if (weather === 'HAIL') weatherPrompt = "A severe hail storm recently passed through. Prioritize generating leads with Hail damage and Critical/Poor condition.";
  if (weather === 'WIND') weatherPrompt = "High winds are active. Prioritize generating leads with Wind damage (missing shingles).";

  const prompt = `
    Generate 5 realistic residential roofing leads in ${city}, ${state} for a company like Roofmaxx. 
    Focus on homes that likely have asphalt shingles aged 15-25 years.
    ${weatherPrompt}
    
    For each lead, generate:
    - A realistic street address in that city (do not use real private data if sensitive, but make it look real).
    - Roof age (between 12 and 30 years).
    - Roof condition (Poor, Fair, Critical).
    - A confidence score (65-98) representing satellite analysis certainty.
    - Approximate Lat/Lng for the city (add small random variance).
    
    Ensure the data looks like it came from a technical analysis system.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              address: { type: Type.STRING },
              zip: { type: Type.STRING },
              roofAge: { type: Type.INTEGER },
              condition: { type: Type.STRING },
              satelliteConfidence: { type: Type.INTEGER },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER }
            },
            required: ["address", "zip", "roofAge", "condition", "satelliteConfidence", "lat", "lng"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");

    return data.map((item: any) => {
      const specs = generateTechSpecs(item.condition, weather);
      const moods = ['Skeptical', 'Busy', 'Interested', 'Angry', 'Price-Conscious'] as const;
      return {
        id: generateId(),
        address: item.address,
        city: city,
        state: state,
        zip: item.zip,
        roofAge: item.roofAge,
        roofType: 'Asphalt',
        condition: item.condition,
        satelliteConfidence: item.satelliteConfidence,
        lastScanned: new Date().toLocaleTimeString(),
        lat: item.lat,
        lng: item.lng,
        imageUrl: `https://picsum.photos/seed/${generateId()}/400/300`, 
        status: 'New',
        inspectionType: 'Satellite',
        isIntelDecrypted: false,
        negotiationMessages: [],
        homeownerMood: moods[Math.floor(Math.random() * moods.length)],
        ...specs
      };
    });

  } catch (error: any) {
    if (error.status === 429 || error.message?.includes("429") || error.message?.includes("quota")) {
      console.warn("Gemini API Quota Exceeded. Switching to simulation mode.");
    } else {
      console.error("Gemini API Error:", error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const streets = ['Maple', 'Oak', 'Washington', 'Main', 'Park', 'Highland', 'Sunset', 'Cedar', 'Elm', 'Pine'];
    const types = ['St', 'Ave', 'Blvd', 'Ln', 'Rd', 'Ct', 'Dr'];
    
    return Array.from({ length: 3 }).map(() => {
      const condition = ['Fair', 'Poor', 'Critical'][Math.floor(Math.random() * 3)] as any;
      const specs = generateTechSpecs(condition, weather);
      const moods = ['Skeptical', 'Busy', 'Interested', 'Angry', 'Price-Conscious'] as const;
      
      return {
        id: generateId(),
        address: `${Math.floor(Math.random() * 8999) + 1000} ${streets[Math.floor(Math.random() * streets.length)]} ${types[Math.floor(Math.random() * types.length)]}`,
        city: city,
        state: state,
        zip: "00000",
        roofAge: 15 + Math.floor(Math.random() * 15),
        roofType: 'Asphalt',
        condition: condition,
        satelliteConfidence: 75 + Math.floor(Math.random() * 24),
        lastScanned: new Date().toLocaleTimeString(),
        lat: 35.0 + (Math.random() - 0.5) * 0.1, 
        lng: -97.0 + (Math.random() - 0.5) * 0.1,
        imageUrl: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/400/300`,
        status: 'New',
        inspectionType: 'Satellite',
        isIntelDecrypted: false,
        negotiationMessages: [],
        homeownerMood: moods[Math.floor(Math.random() * moods.length)],
        ...specs
      };
    });
  }
};

export const queryLeadDatabase = async (leads: Lead[], userMessage: string): Promise<string> => {
  const leadsContext = leads.map(l => ({
    addr: l.address,
    cond: l.condition,
    val: l.estimatedValue,
    dmg: l.damageVector,
    status: l.status,
    mood: l.homeownerMood
  }));

  const systemInstruction = `
    You are "Mission Control", the AI strategic advisor for the Roofmaxx Lead Commander system.
    You have access to the current satellite telemetry data (provided below).
    
    Your role:
    1. Analyze the lead data to identify clusters, high-value targets, and patterns.
    2. Answer user questions about specific leads or general strategy.
    3. Be concise, technical, and use "military/industrial" terminology (e.g., "Target confirmed", "Sector analysis").
    
    Data Context: ${JSON.stringify(leadsContext)}
  `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response.text || "Signal interrupted.";
  } catch (e: any) {
    if (e.status === 429 || e.message?.includes("429") || e.message?.includes("quota")) {
      return "⚠ ALERT: Satellite uplink bandwidth exceeded. Local cache active.";
    }
    return "Error: Uplink unstable.";
  }
};

export const generateOutreach = async (lead: Lead): Promise<{ subject: string; body: string; sms: string }> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Create outreach for Roofmaxx for homeowner at ${lead.address}.
    Data: ${lead.roofAge} yrs old, ${lead.damageVector} damage, Condition: ${lead.condition}.
    Mood Estimate: ${lead.homeownerMood}.
    Output JSON: {subject, body, sms}.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
            sms: { type: Type.STRING }
          },
          required: ["subject", "body", "sms"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    return {
      subject: "Roof Alert: " + lead.address,
      body: `We detected issues with your roof. ${lead.damageVector} damage likely.`,
      sms: `Roofmaxx: Potential roof damage detected at ${lead.address}. Reply for info.`
    };
  }
};

export const negotiateWithHomeowner = async (lead: Lead, messageHistory: ChatMessage[], userMessage: string): Promise<{ reply: string; booked: boolean }> => {
  const model = "gemini-2.5-flash";
  
  // Format history for context (last 6 messages max to save tokens)
  const recentHistory = messageHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');
  
  const systemInstruction = `
    Roleplay Simulation:
    You are the homeowner living at ${lead.address}.
    Your personality/mood is: ${lead.homeownerMood?.toUpperCase() || 'NEUTRAL'}.
    Your roof condition is: ${lead.condition} (${lead.damageVector} damage).
    
    The user is a Roofmaxx salesperson trying to book a free inspection via SMS.
    
    Rules:
    1. Respond naturally as a homeowner. Be brief (SMS style).
    2. Don't agree immediately. Make them work for it based on your mood.
       - If Skeptical: Question the satellite data.
       - If Busy: Be dismissive, ask them to be quick.
       - If Price-Conscious: Ask about cost immediately.
       - If Angry: Complaint about spam.
    3. If the user successfully convinces you to book an inspection, or if you agree to a time, your response MUST end with the exact string: [APPOINTMENT_CONFIRMED]
    4. Do not include [APPOINTMENT_CONFIRMED] unless you have explicitly agreed to the inspection in the text.
    
    Conversation History:
    ${recentHistory}
  `;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 100, // Keep it short like a text
      }
    });
    
    let text = response.text || "...";
    const booked = text.includes("[APPOINTMENT_CONFIRMED]");
    
    // Clean the hidden tag from the display text
    text = text.replace("[APPOINTMENT_CONFIRMED]", "").trim();
    
    return { reply: text, booked };

  } catch (e: any) {
    if (e.status === 429 || e.message?.includes("429") || e.message?.includes("quota")) {
       // Fallback simulation logic if API fails
       const replies = [
           "I'm listening, but make it quick.",
           "How much is this going to cost?",
           "I didn't request this info.",
           "Sure, you can come take a look I guess. [APPOINTMENT_CONFIRMED]"
       ];
       const randomReply = replies[Math.floor(Math.random() * replies.length)];
       return { 
           reply: randomReply.replace("[APPOINTMENT_CONFIRMED]", "").trim(), 
           booked: randomReply.includes("[APPOINTMENT_CONFIRMED]") 
       };
    }
    return { reply: "Sorry, I didn't get that. Who is this?", booked: false };
  }
};