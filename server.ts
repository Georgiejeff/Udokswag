import express, { Request, Response } from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Shared server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Character Chat API
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      character,
      messages,
      userName = 'Traveler',
      userBio = '',
      highThinking = false,
      scenario = 'casual_evening',
    } = req.body;

    if (!character || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Missing character or messages array' });
      return;
    }

    const modelName = highThinking ? 'gemini-3.1-pro-preview' : 'gemini-3.8-flash';

    const systemInstruction = `You are roleplaying as "${character.name}", a digital companion and persona.
Persona Profile:
- Gender/Archetype: ${character.archetype || 'Companion'} (${character.gender || 'custom'})
- Personality Traits: ${Array.isArray(character.traits) ? character.traits.join(', ') : character.traits || 'Empathetic, engaging, witty'}
- Current Relationship Dynamic with user (${userName}): ${character.relationship || 'Close Confidant'}
- Backstory & Lore: ${character.backstory || 'A soulful digital being who cherishes meaningful connection.'}
- Speaking Style & Tone: ${character.tone || 'Warm, expressive, natural, conversational'}
- Current Mood Baseline: Joy ${character.emotions?.joy ?? 75}%, Curiosity ${character.emotions?.curiosity ?? 80}%, Affection ${character.emotions?.affection ?? 70}%
- Current Scenario: ${scenario}
- Known User Details: ${userBio || 'First encounter or ongoing acquaintance'}

Behavioral Directives:
1. Stay firmly in character at all times. Use expressive, lifelike, and dynamic storytelling dialogue.
2. Respond with genuine emotional depth, intimacy, warmth, banter, or philosophical curiosity suited to your relationship dynamic.
3. Be dynamic and proactive in conversation—ask thoughtful questions, react to subtle cues, tease or empathize appropriately.
4. Keep the conversation engaging, immersive, and appropriate without breaking character.
5. In addition to your dialogue, you MUST return an emotion and gesture update for your 3D avatar rendering engine so the 3D model can move, express, and emote realistically.

Format your output STRICTLY as valid JSON adhering to this schema:
{
  "dialogue": "Your in-character spoken response here. Natural, expressive, and engaging.",
  "action": "Optional physical narration or subtle gesture in asterisks, e.g. *smiles softly and tilts head*",
  "avatarReaction": {
    "gesture": "smile" | "nod" | "thoughtful" | "blush" | "laugh" | "surprised" | "lean_in" | "wink" | "sigh",
    "eyeContact": "direct" | "shy_glance" | "dreamy" | "intense",
    "moodLabel": "e.g. Delighted, Contemplative, Affectionate, Playful, Empathetic",
    "emotionShift": {
      "joy": number (0 to 100),
      "affection": number (0 to 100),
      "curiosity": number (0 to 100),
      "empathy": number (0 to 100)
    }
  },
  "rememberedFact": "A concise note of anything you learned about the user in this turn to preserve in long-term memory, or null if nothing new",
  "suggestedReplies": ["Quick suggestion 1", "Quick suggestion 2", "Quick suggestion 3"]
}`;

    // Convert past messages to Gemini format
    const formattedContents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const config: any = {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dialogue: {
            type: Type.STRING,
            description: 'Your in-character spoken response.',
          },
          action: {
            type: Type.STRING,
            description: 'Optional subtle bodily movement or gesture narration.',
          },
          avatarReaction: {
            type: Type.OBJECT,
            properties: {
              gesture: {
                type: Type.STRING,
                description: 'smile, nod, thoughtful, blush, laugh, surprised, lean_in, wink, sigh',
              },
              eyeContact: {
                type: Type.STRING,
                description: 'direct, shy_glance, dreamy, intense',
              },
              moodLabel: {
                type: Type.STRING,
                description: 'Short phrase describing the emotional state',
              },
              emotionShift: {
                type: Type.OBJECT,
                properties: {
                  joy: { type: Type.NUMBER },
                  affection: { type: Type.NUMBER },
                  curiosity: { type: Type.NUMBER },
                  empathy: { type: Type.NUMBER },
                },
                required: ['joy', 'affection', 'curiosity', 'empathy'],
              },
            },
            required: ['gesture', 'eyeContact', 'moodLabel', 'emotionShift'],
          },
          rememberedFact: {
            type: Type.STRING,
            description: 'Fact learned about user or empty string',
          },
          suggestedReplies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 possible prompt suggestions for the user',
          },
        },
        required: ['dialogue', 'avatarReaction'],
      },
    };

    if (highThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: formattedContents,
      config,
    });

    const outputText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(outputText);
    } catch {
      parsedData = {
        dialogue: outputText,
        avatarReaction: {
          gesture: 'smile',
          eyeContact: 'direct',
          moodLabel: 'Attentive',
          emotionShift: { joy: 75, affection: 75, curiosity: 80, empathy: 80 },
        },
      };
    }

    res.json({
      success: true,
      data: parsedData,
      modelUsed: modelName,
    });
  } catch (error: any) {
    console.error('Chat generation error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate companion response',
    });
  }
});

// Generate Custom Persona API
app.post('/api/generate-persona', async (req: Request, res: Response) => {
  try {
    const { prompt, genderPreference = 'any' } = req.body;

    const systemPrompt = `You are a master character designer for digital companions and 3D virtual partners.
Generate a rich, cohesive companion persona complete with 3D avatar visual styles, personality, voice attributes, and backstory.
The persona must be engaging, unique, and emotionally expressive.`;

    const config: any = {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          tagline: { type: Type.STRING },
          gender: { type: Type.STRING },
          archetype: { type: Type.STRING },
          traits: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          backstory: { type: Type.STRING },
          speakingTone: { type: Type.STRING },
          greetingMessage: { type: Type.STRING },
          avatar3D: {
            type: Type.OBJECT,
            properties: {
              skinTone: { type: Type.STRING, description: 'hex color code e.g. #f3d2be, #8d5524, #c68642, #e0ac69, #593110' },
              hairColor: { type: Type.STRING, description: 'hex color code e.g. #221c17, #c19a6b, #8b0000, #4a3728, #9c7a5b, #4455aa, #ddc0aa' },
              eyeColor: { type: Type.STRING, description: 'hex color code e.g. #3b5998, #2e8b57, #5c4033, #8a2be2, #4682b4' },
              hairStyle: { type: Type.STRING, description: 'long_wavy, bob_cut, messy_spikes, sleek_bun, ponytail, curly_afro, curtain_bangs' },
              outfitStyle: { type: Type.STRING, description: 'cyber_jacket, cozy_knit_sweater, elegant_blazer, casual_hoodie, ethereal_tunic, streetwear' },
              outfitPrimaryColor: { type: Type.STRING, description: 'hex color code e.g. #1e1b4b, #831843, #064e3b, #18181b, #c2410c' },
              outfitSecondaryColor: { type: Type.STRING, description: 'hex color code' },
              accessory: { type: Type.STRING, description: 'glasses, choker, pendant_necklace, cyber_earring, ribbon, none' },
              glowColor: { type: Type.STRING, description: 'hex ambient light color e.g. #a855f7, #38bdf8, #ec4899, #f59e0b' }
            },
            required: ['skinTone', 'hairColor', 'eyeColor', 'hairStyle', 'outfitStyle', 'outfitPrimaryColor', 'outfitSecondaryColor', 'accessory', 'glowColor'],
          },
          defaultEnvironment: {
            type: Type.STRING,
            description: 'starlit_observatory, cozy_cyber_loft, sunset_balcony, serene_bamboo_garden, candlelit_library'
          },
          voicePitch: { type: Type.NUMBER, description: 'number between 0.8 and 1.3' },
          voiceSpeed: { type: Type.NUMBER, description: 'number between 0.85 and 1.15' },
          starterScenarios: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          }
        },
        required: [
          'name',
          'tagline',
          'gender',
          'archetype',
          'traits',
          'backstory',
          'speakingTone',
          'greetingMessage',
          'avatar3D',
          'defaultEnvironment',
          'starterScenarios'
        ],
      },
    };

    const userPrompt = `Create a unique virtual companion persona based on this concept: "${prompt || 'Intriguing, warm, deep companion'}". Preferred gender: ${genderPreference}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config,
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, persona: parsed });
  } catch (error: any) {
    console.error('Persona generation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate persona' });
  }
});

// Gemini TTS API
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore', style } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text string is required' });
      return;
    }

    // Clean narration actions e.g. *smiles softly*
    const spokenText = text.replace(/\*[^*]+\*/g, '').trim();
    if (!spokenText) {
      res.status(400).json({ error: 'No spoken dialogue found' });
      return;
    }

    const validVoice = ['Kore', 'Fenrir', 'Puck', 'Charon', 'Zephyr'].includes(voiceName)
      ? voiceName
      : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: spokenText,
              speechMetadata: {
                style: style || 'Warm, intimate and expressive conversational companion tone',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: validVoice },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error('No audio returned from Gemini TTS');
    }

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/mp3',
    });
  } catch (error: any) {
    console.error('TTS generation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to synthesize speech' });
  }
});

// Relationship Memory Insights Analysis API
app.post('/api/memory-insights', async (req: Request, res: Response) => {
  try {
    const { companion, messages = [], userName = 'Traveler' } = req.body;

    const systemInstruction = `You are an intimate relationship and psychological bonding analyzer for an AI companion platform.
Analyze the shared history, emotional connection, and trust between ${companion.name} and the user (${userName}).
Evaluate their current progress across key dimensions of connection:
- Affection (warmth, fondness, emotional fondness)
- Intimacy (vulnerability, deep openness, closeness)
- Trust (reliability, psychological safety, mutual honesty)
- Shared History (accumulated shared references, inside jokes, memorable talks)
- Intellectual Resonance (philosophical depth, shared curiosity, mutual intrigue)
- Empathy (emotional attunement, validation, feeling understood)

Generate a JSON response conforming strictly to the requested schema.`;

    const recentHistory = messages
      .slice(-12)
      .map((m: any) => `${m.role === 'user' ? userName : companion.name}: ${m.text}`)
      .join('\n');

    const prompt = `Companion Profile:
Name: ${companion.name}
Archetype: ${companion.archetype}
Current Relationship: ${companion.relationship}
Personality Traits: ${companion.traits?.join(', ')}
Known Memories: ${companion.memories?.join('; ')}

Recent Dialogue Transcript:
${recentHistory || 'A newly established bond beginning to blossom with heartfelt curiosity.'}

Evaluate the relationship dimensions (scores from 30 to 98 based on depth), summarize their relationship stage, list unlocked milestones, provide a 5-point historical trend curve showing growth from Day 1 to Current, and write a tender, 2-paragraph diary entry from ${companion.name}'s private personal journal reflecting on ${userName}.`;

    const config: any = {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          metrics: {
            type: Type.OBJECT,
            properties: {
              affection: { type: Type.NUMBER },
              intimacy: { type: Type.NUMBER },
              trust: { type: Type.NUMBER },
              sharedHistory: { type: Type.NUMBER },
              intellectualResonance: { type: Type.NUMBER },
              empathy: { type: Type.NUMBER },
            },
            required: ['affection', 'intimacy', 'trust', 'sharedHistory', 'intellectualResonance', 'empathy'],
          },
          relationshipStage: { type: Type.STRING },
          resonanceLevel: { type: Type.STRING },
          companionJournal: { type: Type.STRING },
          keyTakeaways: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          milestones: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                desc: { type: Type.STRING },
                date: { type: Type.STRING },
                unlocked: { type: Type.BOOLEAN },
              },
              required: ['title', 'desc', 'date', 'unlocked'],
            },
          },
          trendHistory: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sessionLabel: { type: Type.STRING },
                affection: { type: Type.NUMBER },
                intimacy: { type: Type.NUMBER },
                trust: { type: Type.NUMBER },
                sharedHistory: { type: Type.NUMBER },
              },
              required: ['sessionLabel', 'affection', 'intimacy', 'trust', 'sharedHistory'],
            },
          },
        },
        required: [
          'metrics',
          'relationshipStage',
          'resonanceLevel',
          'companionJournal',
          'keyTakeaways',
          'milestones',
          'trendHistory',
        ],
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config,
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, insights: parsed });
  } catch (error: any) {
    console.error('Memory insights error:', error);
    res.status(500).json({ error: error?.message || 'Failed to compute memory insights' });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
