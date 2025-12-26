import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Summarize conversation transcript using GPT
 * @param {string} transcript - Conversation transcript
 * @returns {Promise<Object>} - Summary object with overview, keyPoints, decisions, actionItems
 */
export const summarizeConversation = async (transcript) => {
  try {
    const prompt = `Analyze the following conversation transcript and provide a structured summary in JSON format. Extract:

1. Overview: A brief 2-3 sentence summary of the entire conversation
2. Key Points: An array of 3-7 main points discussed (each as a string)
3. Decisions: An array of decisions made during the conversation (each as a string)
4. Action Items: An array of action items with the following structure:
   - item: Description of the action
   - assignedTo: Name or identifier of person responsible (if mentioned, otherwise null)
   - dueDate: Due date if mentioned (ISO format), otherwise null

Return ONLY valid JSON in this exact format:
{
  "overview": "string",
  "keyPoints": ["string1", "string2"],
  "decisions": ["string1", "string2"],
  "actionItems": [
    {
      "item": "string",
      "assignedTo": "string or null",
      "dueDate": "ISO date string or null"
    }
  ]
}

Transcript:
${transcript}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a professional meeting assistant that extracts structured information from conversations. Always return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const summaryText = completion.choices[0].message.content;
    const summary = JSON.parse(summaryText);

    // Validate and structure the response
    return {
      overview: summary.overview || 'No overview available',
      keyPoints: Array.isArray(summary.keyPoints) ? summary.keyPoints : [],
      decisions: Array.isArray(summary.decisions) ? summary.decisions : [],
      actionItems: Array.isArray(summary.actionItems)
        ? summary.actionItems.map(item => ({
          item: item.item || item,
          assignedTo: item.assignedTo || null,
          dueDate: item.dueDate || null
        }))
        : []
    };
  } catch (error) {
    console.error('GPT summarization error:', error);
    throw new Error(`Failed to summarize conversation: ${error.message}`);
  }
};

