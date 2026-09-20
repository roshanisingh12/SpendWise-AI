import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { aiChatSchema } from '../schemas/validation';
import * as aiService from '../services/aiService';
import { sendSuccess, sendError } from '../utils/response';

export async function chat(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const validated = aiChatSchema.parse(req.body);
    const userName = req.user?.name || 'User';

    const response = await aiService.generateChatResponse(
      userId,
      validated.message,
      userName,
      validated.conversationHistory
    );

    sendSuccess(res, response, 'AI response generated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getSuggestions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const suggestions = [
      { id: '1', prompt: 'Give me a summary of my finances', label: 'Financial summary' },
      { id: '2', prompt: 'Where did I spend the most this month?', label: 'Top spending category' },
      { id: '3', prompt: 'How much did I spend this month?', label: 'Monthly spending' },
      { id: '4', prompt: 'How much did I save this month?', label: 'Savings & savings rate' },
      { id: '5', prompt: 'How much is left in my budget?', label: 'Budget status' },
      { id: '6', prompt: 'Am I spending more than last month?', label: 'Month comparison' },
      { id: '7', prompt: 'Where can I reduce unnecessary spending?', label: 'Cut back suggestions' },
      { id: '8', prompt: 'How close am I to my savings goals?', label: 'Savings goals progress' },
    ];

    sendSuccess(res, { suggestions });
  } catch (error) {
    next(error);
  }
}
