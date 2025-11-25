
import { GoogleGenAI } from "@google/genai";
import { BudgetData, EventData } from "../types";
import { calculateTotals } from "./calculations";

export const analyzeBudgetWithAI = async (
  history: BudgetData[],
  currencySymbol: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 1. Prepare Data Context for the AI
    // We summarize the data to ensure we don't send excessive tokens, focusing on trends.
    const sortedHistory = [...history].sort((a, b) => a.created - b.created);
    
    const summary = sortedHistory.map(period => {
      const t = calculateTotals(period);
      return {
        period: `${period.month + 1}/${period.year}`,
        income: t.totalIncome,
        expenses: t.totalExpenses,
        savings: t.totalSavings,
        debtPayment: t.totalDebts,
        leftToSpend: t.leftToSpend
      };
    });

    const contextData = JSON.stringify(summary.slice(-6)); // Last 6 periods for context

    // 2. Construct Prompt
    const prompt = `
      You are an expert personal financial advisor using the Gemini 2.5 Flash model.
      
      Here is the financial summary for the last few periods (${currencySymbol}):
      ${contextData}

      Please provide a concise analysis in the following format:
      1. **Trend Analysis**: Are expenses going up or down? Is income stable?
      2. **Savings Health**: Comment on the savings rate.
      3. **Prediction**: Based on the trend, predict the financial outlook for next month.
      4. **Actionable Advice**: Give 1 specific, hard-hitting tip to improve financial health immediately.

      Keep the tone encouraging but professional. concise (under 200 words).
      Do not use markdown formatting like bold or headers, just plain text with line breaks.
    `;

    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 } // Enable thinking for better analytical reasoning
      }
    });

    return response.text || "Unable to generate analysis at this time.";

  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return "AI Analysis is currently unavailable. Please check your connection or API key.";
  }
};

export const analyzeEventWithAI = async (
  event: Partial<EventData>,
  query: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const eventContext = `
      Event Name: ${event.name || 'New Event'}
      Type: ${event.type || 'General'}
      Total Budget: ${event.currencySymbol}${event.totalBudget || 0}
      Date: ${event.date || 'TBD'}
      Location: ${event.location || 'TBD'}
      Current Expenses: ${JSON.stringify(event.expenses?.map(e => ({ cat: e.category, amt: e.amount })) || [])}
    `;

    const prompt = `
      You are a professional Event Planner AI.
      Context: ${eventContext}
      
      User Query: "${query}"
      
      Provide a helpful, specific, and creative response. 
      If asked for a budget breakdown, provide percentage estimates based on the event type.
      If asked about vendors, suggest types of vendors needed.
      Keep it concise (under 150 words).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "I couldn't process that request right now.";

  } catch (error) {
    console.error("AI Event Analysis Failed:", error);
    return "Event AI is currently unavailable.";
  }
};

export const generateStrategyPlan = async (
  context: {
    eventType: string;
    monthlyCost: number;
    currentExpenses: { name: string; amount: number }[];
    strategy: 'cut' | 'earn' | 'save';
    currencySymbol: string;
  }
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const expenseSummary = context.currentExpenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(e => `${e.name}: ${context.currencySymbol}${e.amount}`)
      .join(', ');

    let strategyPrompt = "";
    if (context.strategy === 'cut') {
      strategyPrompt = `The goal is to reduce expenses to cover a new ${context.eventType} cost of ${context.currencySymbol}${context.monthlyCost}/month. Identify specific cuts based on these top expenses: ${expenseSummary}.`;
    } else if (context.strategy === 'earn') {
      strategyPrompt = `The goal is to earn an extra ${context.currencySymbol}${context.monthlyCost}/month for a ${context.eventType}. Suggest realistic side hustles or income boosts.`;
    } else {
      strategyPrompt = `The goal is to save ${context.currencySymbol}${context.monthlyCost}/month in advance for a ${context.eventType}. Suggest behavioral changes to "practice" this payment now.`;
    }

    const prompt = `
      You are a tactical financial coach.
      ${strategyPrompt}
      
      Provide a 3-step micro-plan.
      Step 1: Immediate Action.
      Step 2: Short-term Adjustment.
      Step 3: Mindset Shift.
      
      Keep it extremely concise, bullet points only. No intro/outro.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Unable to generate plan.";

  } catch (error) {
    console.error("AI Strategy Generation Failed:", error);
    return "Could not generate a detailed plan. Proceeding with default values.";
  }
};
