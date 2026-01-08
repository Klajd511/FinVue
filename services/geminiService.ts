
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Currency, SUPPORTED_CURRENCIES, TransactionType } from "../types";

// Always use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ParsedTransaction {
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  date: string;
  currencyCode: string;
}

export const getFinancialInsights = async (transactions: Transaction[], preferredCurrency: Currency): Promise<string> => {
  if (transactions.length === 0) return "Add some transactions to get started with AI insights!";

  const summary = transactions.map(t => {
    const curr = SUPPORTED_CURRENCIES.find(c => c.code === t.currencyCode) || preferredCurrency;
    return `${t.date}: ${t.type} of ${curr.symbol}${t.amount} (${t.currencyCode}) for ${t.description || 'unspecified item'} (${t.category})`;
  }).join('\n');
  
  const prompt = `
    As a professional financial advisor, analyze the following multi-currency transaction history.
    The user's preferred display currency is ${preferredCurrency.name} (${preferredCurrency.code}).
    Identify spending patterns, suggest potential savings, and give a "Financial Health Score" out of 100.
    Please account for the different currencies (USD, EUR, ALL) mentioned in the transactions.
    Format the response using Markdown with bold headers and bullet points.
    
    Transactions:
    ${summary}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    });

    // Directly access the .text property from GenerateContentResponse
    return response.text || "Unable to generate insights at this moment.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to AI advisor. Please try again later.";
  }
};

export const parseNaturalLanguageTransaction = async (
  input: string, 
  categories: { expense: string[], income: string[] }
): Promise<ParsedTransaction | null> => {
  const today = new Date().toISOString().split('T')[0];
  const currencyCodes = SUPPORTED_CURRENCIES.map(c => c.code).join(', ');
  
  const prompt = `
    Parse the following financial transaction description into a structured JSON object.
    Current Date: ${today}
    Valid Expense Categories: ${categories.expense.join(', ')}
    Valid Income Categories: ${categories.income.join(', ')}
    Supported Currencies: ${currencyCodes}

    If the category isn't an exact match, map it to the closest valid category.
    If the date isn't mentioned, assume today (${today}). Handle relative terms like "yesterday" or "last Friday".
    If no currency is mentioned, default to USD.

    Input: "${input}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['expense', 'income'] },
            date: { type: Type.STRING, description: 'YYYY-MM-DD' },
            currencyCode: { type: Type.STRING }
          },
          required: ['description', 'amount', 'category', 'type', 'date', 'currencyCode']
        }
      }
    });

    // Access text property directly from the response
    return JSON.parse(response.text || '{}') as ParsedTransaction;
  } catch (error) {
    console.error("Parsing Error:", error);
    return null;
  }
};
