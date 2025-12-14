import { GoogleGenAI, Type } from "@google/genai";
import { FireworkConfig, ExplosionType } from "../types";

const parseConfig = (text: string): FireworkConfig | null => {
  try {
    const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
};

export const generateFireworkConfig = async (
  description: string
): Promise<FireworkConfig | null> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Design a spectacular firework configuration based on: "${description}".
      
      Aim for visual complexity.
      - 'pistil' type creates a double-layer effect (core + shell), excellent for 'complex' requests.
      - 'willow' and 'palm' are majestic.
      - 'crossette' splits into multiple sparks.
      - 'secondaryHue' is useful for dual-color fireworks (e.g., Red with Gold core).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Mystical name (e.g., 'Dragon's Breath')" },
            hue: {
              type: Type.OBJECT,
              properties: {
                min: { type: Type.NUMBER },
                max: { type: Type.NUMBER },
              },
              required: ["min", "max"],
            },
            secondaryHue: { type: Type.NUMBER, description: "Optional hue for inner core (0-360)" },
            saturation: { type: Type.NUMBER },
            lightness: { type: Type.NUMBER },
            particleCount: { type: Type.NUMBER, description: "100-400 for complex looks" },
            initialVelocity: { type: Type.NUMBER, description: "8-18" },
            gravity: { type: Type.NUMBER, description: "0.05-0.2" },
            friction: { type: Type.NUMBER, description: "0.92-0.98" },
            decay: {
              type: Type.OBJECT,
              properties: {
                min: { type: Type.NUMBER },
                max: { type: Type.NUMBER },
              },
              required: ["min", "max"],
            },
            explosionType: {
              type: Type.STRING,
              enum: [
                ExplosionType.SPHERE,
                ExplosionType.STAR,
                ExplosionType.RING,
                ExplosionType.PISTIL,
                ExplosionType.WILLOW,
                ExplosionType.CROSSETTE,
                ExplosionType.PALM
              ],
            },
            hasTrail: { type: Type.BOOLEAN },
            trailLength: { type: Type.NUMBER },
          },
          required: [
            "name",
            "hue",
            "saturation",
            "lightness",
            "particleCount",
            "initialVelocity",
            "gravity",
            "friction",
            "decay",
            "explosionType",
            "hasTrail",
            "trailLength",
          ],
        },
      },
    });

    return parseConfig(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};