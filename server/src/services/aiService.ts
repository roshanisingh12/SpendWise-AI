import { env } from '../config/env';
import {
  getUserFinancialContext,
  formatFinancialContextForPrompt,
  FinancialContext,
} from './aiContextService';
import { AiChatMessageInput } from '../schemas/validation';

export interface AiChatResponse {
  message: string;
  metadata: {
    usedFinancialData: boolean;
    provider: string;
    model?: string;
  };
}

const SYSTEM_PROMPT = `You are SpendWise AI, an expert, encouraging, and highly analytical personal financial assistant.
Your job is to help the user understand their authenticated financial data, track their budgets, meet savings goals, and make smart spending decisions.

STRICT OPERATIONAL RULES:
1. ONLY use the verified financial data provided in the prompt context.
2. NEVER invent, hallucinate, or assume transactions, balances, dates, or account numbers that are not in the context.
3. CLEARLY distinguish calculated facts (e.g. "You spent $450 on Dining") from suggestions/advice (e.g. "You could save $50 by eating out once less per week").
4. Keep answers clear, well-structured, concise, and easy to read using Markdown (bullet points, bold highlights, tables when appropriate).
5. If data for a requested item does not exist or is $0, state clearly that no records were found in the current period.
6. FINANCIAL SAFETY: Provide educational insights, budgeting advice, and savings tips. Do NOT provide guaranteed investment promises or risky speculative advice. Always remain responsible and professional.`;

/**
 * Deterministic Financial Reasoning Engine
 * Used when no external LLM API key is present or when external LLM call fails/times out.
 * Answers user questions with 100% mathematical accuracy using real database context.
 */
function generateDeterministicFinancialResponse(
  message: string,
  context: FinancialContext
): string {
  const lower = message.toLowerCase();
  const { currentPeriod, previousPeriod, last7Days, topCategories, largestExpenses, budgets, savingsGoals, matchedSpecificCategory } = context;

  const money = (val: number) => `$${Math.round(val).toLocaleString()}`;
  const precise = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // 1. Category increase comparison: Which categories increased compared with last month?
  if (lower.includes('categor') && (lower.includes('increase') || lower.includes('went up') || lower.includes('rose') || lower.includes('higher') || lower.includes('grow') || lower.includes('compared'))) {
    const increases = context.categoryIncreases.filter((c) => c.diff > 0);
    if (increases.length > 0) {
      const incList = increases
        .map((c) => `• **${c.name}**: +${money(c.diff)} (+${c.diffPercent}%) — ${money(c.currentAmount)} this month vs ${money(c.prevAmount)} last month`)
        .join('\n');
      return `📈 **Category Spending Increases (vs Last Month):**\n\n${incList}\n\n` +
        `💡 *Recommendation: Prioritize reviewing your spending in **${increases[0].name}**, which had the largest monetary jump.*`;
    }
    return `🎉 Good news! None of your spending categories increased compared to **${previousPeriod.monthName}**. All categories were either lower or unchanged.`;
  }

  // 2. Specific Category Spending (e.g. Food, Groceries, Dining, Transport)
  if (matchedSpecificCategory || lower.includes('food') || lower.includes('grocery') || lower.includes('dining') || lower.includes('transport') || lower.includes('shopping')) {
    if (matchedSpecificCategory) {
      const isWeekQuery = lower.includes('week') || lower.includes('last 7 days') || lower.includes('past 7 days');
      if (isWeekQuery) {
        const weekCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const weekTxs = matchedSpecificCategory.transactions.filter((t) => t.date >= weekCutoff);
        const weekSum = weekTxs.reduce((s, t) => s + t.amount, 0);
        const txLines = weekTxs.length > 0
          ? `\n\n**Transactions in the last 7 days:**\n` +
            weekTxs.map((t) => `• ${t.date}: **${t.description}** — ${precise(t.amount)}`).join('\n')
          : '\n\n*No transactions recorded for this category in the last 7 days.*';

        return `Over the last 7 days, you spent **${money(weekSum)}** on **${matchedSpecificCategory.name}** across **${weekTxs.length}** transaction(s).${txLines}`;
      }

      const txLines = matchedSpecificCategory.transactions.length > 0
        ? `\n\n**Recent ${matchedSpecificCategory.name} Transactions:**\n` +
          matchedSpecificCategory.transactions.map((t) => `• ${t.date}: **${t.description}** — ${precise(t.amount)}`).join('\n')
        : '';

      return `Based on your records for **${currentPeriod.monthName} ${currentPeriod.year}**, you have spent **${money(matchedSpecificCategory.amount)}** on **${matchedSpecificCategory.name}**.\n\n` +
        `This represents **${matchedSpecificCategory.percentage}%** of your total expenses (${money(currentPeriod.totalExpenses)}).${txLines}`;
    }
  }

  // 3. What did I spend the most on? / Largest category
  if (lower.includes('spend the most') || lower.includes('largest category') || lower.includes('top category') || lower.includes('most of my money') || lower.includes('where did i spend')) {
    if (topCategories.length > 0) {
      const top = topCategories[0];
      const otherTop = topCategories.slice(1, 4).map((c) => `• **${c.name}**: ${money(c.amount)} (${c.percentage}%)`).join('\n');
      return `Your highest spending category this period is **${top.name}** with a total of **${money(top.amount)}**, making up **${top.percentage}%** of your total expenses.\n\n` +
        (otherTop ? `**Other top spending areas:**\n${otherTop}\n\n` : '') +
        `💡 *Suggestion: Keep an eye on ${top.name} expenses to ensure they stay aligned with your monthly goals.*`;
    }
    return `You have not recorded any category expenses for **${currentPeriod.monthName} ${currentPeriod.year}** yet.`;
  }

  // 4. Biggest / Largest Expenses
  if (lower.includes('biggest expense') || lower.includes('largest expense') || lower.includes('biggest transactions')) {
    if (largestExpenses.length > 0) {
      const list = largestExpenses.map((e, idx) => `${idx + 1}. **${e.description}** (${e.category}): ${money(e.amount)} on *${e.date}*`).join('\n');
      return `Here are your largest individual expenses:\n\n${list}\n\n` +
        `These major purchases comprise a significant portion of your total monthly outflow.`;
    }
    return `No expense transactions were found in your transaction history.`;
  }

  // 5. How much did I spend this week / last 7 days?
  if (lower.includes('this week') || lower.includes('past week') || lower.includes('last 7 days')) {
    return `Over the last 7 days, you have spent a total of **${money(last7Days.totalExpenses)}** across **${last7Days.transactionCount}** transaction(s).\n\n` +
      `Your total spending for the full month of **${currentPeriod.monthName}** stands at **${money(currentPeriod.totalExpenses)}**.`;
  }

  // 6. Month over month comparison: Am I spending more than last month? / What changed?
  if (lower.includes('last month') || lower.includes('spending more') || lower.includes('what changed') || lower.includes('compare')) {
    const diff = previousPeriod.expenseDiff;
    const pct = previousPeriod.expenseDiffPercent;
    if (previousPeriod.totalExpenses === 0 && currentPeriod.totalExpenses === 0) {
      return `There are currently insufficient historical records to compare **${currentPeriod.monthName}** with **${previousPeriod.monthName}**.`;
    }

    if (diff > 0) {
      return `📊 **Spending Comparison:**\n\n` +
        `• **${currentPeriod.monthName} ${currentPeriod.year}**: ${money(currentPeriod.totalExpenses)}\n` +
        `• **${previousPeriod.monthName} ${previousPeriod.year}**: ${money(previousPeriod.totalExpenses)}\n\n` +
        `You have spent **${money(diff)} more (+${pct}%)** this month compared to ${previousPeriod.monthName}. ` +
        `Consider reviewing your top categories to see where the increase occurred.`;
    } else if (diff < 0) {
      return `🎉 **Great progress!**\n\n` +
        `• **${currentPeriod.monthName} ${currentPeriod.year}**: ${money(currentPeriod.totalExpenses)}\n` +
        `• **${previousPeriod.monthName} ${previousPeriod.year}**: ${money(previousPeriod.totalExpenses)}\n\n` +
        `Your spending is **down by ${money(Math.abs(diff))} (-${pct}%)** compared to ${previousPeriod.monthName}!`;
    } else {
      return `Your spending in **${currentPeriod.monthName}** (${money(currentPeriod.totalExpenses)}) is exactly the same as in **${previousPeriod.monthName}** (${money(previousPeriod.totalExpenses)}).`;
    }
  }

  // 7. Budgets status / How much money remains within my budget?
  if (lower.includes('budget') || lower.includes('remain') || lower.includes('how much is left') || lower.includes('left in my budget')) {
    if (budgets.length === 0) {
      return `You don't have any active budgets set up yet. Head over to the **Budgets** section to create monthly limits for your categories!`;
    }

    const budgetLines = budgets.map((b) => {
      const statusIcon = b.isOverBudget ? '⚠️' : b.percentage >= 80 ? '⚡' : '✅';
      const remainingText = b.isOverBudget
        ? `Over by ${money(Math.abs(b.remaining))}`
        : `${money(b.remaining)} remaining`;
      return `${statusIcon} **${b.categoryName}**: Spent ${money(b.actualSpent)} of ${money(b.budgetAmount)} (${b.percentage}% used) — *${remainingText}*`;
    }).join('\n');

    const totalLimit = budgets.reduce((s, b) => s + b.budgetAmount, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.actualSpent, 0);
    const totalRem = totalLimit - totalSpent;

    return `Here is your current budget status:\n\n${budgetLines}\n\n` +
      `**Overall Budget:** Spent **${money(totalSpent)}** of **${money(totalLimit)}** (${totalRem >= 0 ? `${money(totalRem)} remains available` : `Exceeded by ${money(Math.abs(totalRem))}`}).`;
  }

  // 8. Savings Goals: How close am I to my savings goal? / How much did I save?
  if (lower.includes('goal') || lower.includes('save') || lower.includes('savings rate')) {
    if (savingsGoals.length > 0) {
      const goalLines = savingsGoals.map((g) => {
        const icon = g.isCompleted ? '🎉' : '🎯';
        return `${icon} **${g.name}**: Saved ${money(g.currentAmount)} / ${money(g.targetAmount)} (**${g.percentage}%** complete, ${money(g.remaining)} to go)${g.targetDate ? ` • Target: ${g.targetDate}` : ''}`;
      }).join('\n');

      return `Here is your savings progress:\n\n${goalLines}\n\n` +
        `• **Total Saved Across Goals:** **${money(context.totalSavedInGoals)}**\n` +
        `• **Current Month Cash Flow / Net Savings:** **${money(currentPeriod.balance)}** (Savings Rate: **${currentPeriod.savingsRate}%**)\n\n` +
        `Keep up the momentum toward reaching your targets!`;
    }

    return `You haven't set any specific savings goals yet, but this month you have earned **${money(currentPeriod.totalIncome)}** and spent **${money(currentPeriod.totalExpenses)}**, giving you a net savings of **${money(currentPeriod.balance)}** (Savings Rate: **${currentPeriod.savingsRate}%**).`;
  }

  // 9. Reduce spending / Practical changes to save more next month
  if (lower.includes('reduce') || lower.includes('cut back') || lower.includes('unnecessary') || lower.includes('save more') || lower.includes('practical changes') || lower.includes('help me save')) {
    const discretionaryCategories = ['Dining', 'Shopping', 'Entertainment', 'Subscriptions'];
    const discretionarySpending = topCategories
      .filter((c) => discretionaryCategories.includes(c.name))
      .reduce((s, c) => s + c.amount, 0);

    const discretionaryList = topCategories
      .filter((c) => discretionaryCategories.includes(c.name))
      .map((c) => `• **${c.name}**: ${money(c.amount)} (${c.percentage}% of spending)`)
      .join('\n');

    const overBudgetList = budgets
      .filter((b) => b.isOverBudget || b.percentage >= 80)
      .map((b) => `• **${b.categoryName}**: Spent ${money(b.actualSpent)} (Budget: ${money(b.budgetAmount)})`);

    return `💡 **Practical Changes to Save More Next Month:**\n\n` +
      (discretionaryList ? `**Your Discretionary Spending Areas:**\n${discretionaryList}\n*(Total non-essential: ${money(discretionarySpending)})*\n\n` : '') +
      (overBudgetList.length > 0 ? `**Categories Approaching or Exceeding Limits:**\n${overBudgetList.join('\n')}\n\n` : '') +
      `**Actionable Next Steps:**\n` +
      `1. **Trim 15% from Discretionary Spending**: This would free up **${money(discretionarySpending * 0.15)}** directly into your savings.\n` +
      `2. **Establish Category Budget Caps**: Set monthly limits for high-frequency expenses in the **Budgets** tab.\n` +
      `3. **Automate Savings Contributions**: Allocate a portion of your income immediately when received toward your **Savings Goals**.\n` +
      `4. **Audit Recurring Subscriptions**: Review active subscriptions and cancel unused or duplicate services.`;
  }

  // 10. General Financial Summary (Default)
  return `📊 **Financial Summary for ${currentPeriod.monthName} ${currentPeriod.year}** for **${context.user.name}**:\n\n` +
    `• **Total Income:** ${money(currentPeriod.totalIncome)}\n` +
    `• **Total Expenses:** ${money(currentPeriod.totalExpenses)}\n` +
    `• **Net Balance:** ${money(currentPeriod.balance)} ${currentPeriod.balance >= 0 ? '(Positive Cash Flow)' : '(Deficit)'}\n` +
    `• **Savings Rate:** ${currentPeriod.savingsRate}%\n` +
    `• **Total Recorded Transactions:** ${currentPeriod.transactionCount}\n\n` +
    (topCategories.length > 0 ? `**Top Expense:** ${topCategories[0].name} (${money(topCategories[0].amount)}, ${topCategories[0].percentage}%)\n\n` : '') +
    `You can ask me specific questions like *"Where did I spend the most?"*, *"Which categories increased compared with last month?"*, *"How much remains in my budget?"*, or *"What practical changes could help me save more?"*`;
}

/**
 * Calls Google Gemini REST API
 */
async function callGemini(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string,
  conversationHistory: AiChatMessageInput[] = []
): Promise<string> {
  const model = modelName || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMessage}` }],
    },
  ];

  if (conversationHistory.length > 0) {
    // Map prior messages
    const historyParts = conversationHistory.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
    contents.unshift(...historyParts);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API returned ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini response did not contain valid text.');
    }
    return candidateText;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Calls OpenAI / OpenAI-compatible API (e.g. Groq, OpenAI)
 */
async function callOpenAICompatible(
  apiKey: string,
  baseUrl: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string,
  conversationHistory: AiChatMessageInput[] = []
): Promise<string> {
  const model = modelName || 'gpt-4o-mini';
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI API returned ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('AI API did not return message content.');
    }
    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Main AI Chat Orchestrator
 */
export async function generateChatResponse(
  userId: string,
  userMessage: string,
  userName = 'User',
  conversationHistory: AiChatMessageInput[] = []
): Promise<AiChatResponse> {
  // 1. Gather authenticated user financial context
  const financialContext = await getUserFinancialContext(userId, userMessage, userName);
  const contextString = formatFinancialContextForPrompt(financialContext);

  const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${contextString}`;

  // 2. Identify available AI Provider
  const geminiKey = env.GEMINI_API_KEY || (env.AI_PROVIDER === 'gemini' ? env.AI_API_KEY : undefined);
  const openAiKey = env.OPENAI_API_KEY || (env.AI_PROVIDER === 'openai' ? env.AI_API_KEY : undefined);
  const groqKey = env.AI_PROVIDER === 'groq' ? env.AI_API_KEY : undefined;

  // 3. Attempt LLM execution if key exists
  if (geminiKey) {
    try {
      const responseText = await callGemini(
        geminiKey,
        env.AI_MODEL || 'gemini-1.5-flash',
        fullSystemPrompt,
        userMessage,
        conversationHistory
      );
      return {
        message: responseText,
        metadata: {
          usedFinancialData: true,
          provider: 'google-gemini',
          model: env.AI_MODEL || 'gemini-1.5-flash',
        },
      };
    } catch (err) {
      console.warn('Google Gemini call failed, falling back to deterministic financial engine:', err);
    }
  } else if (openAiKey) {
    try {
      const responseText = await callOpenAICompatible(
        openAiKey,
        'https://api.openai.com/v1',
        env.AI_MODEL || 'gpt-4o-mini',
        fullSystemPrompt,
        userMessage,
        conversationHistory
      );
      return {
        message: responseText,
        metadata: {
          usedFinancialData: true,
          provider: 'openai',
          model: env.AI_MODEL || 'gpt-4o-mini',
        },
      };
    } catch (err) {
      console.warn('OpenAI call failed, falling back to deterministic financial engine:', err);
    }
  } else if (groqKey) {
    try {
      const responseText = await callOpenAICompatible(
        groqKey,
        'https://api.groq.com/openai/v1',
        env.AI_MODEL || 'llama-3.3-70b-versatile',
        fullSystemPrompt,
        userMessage,
        conversationHistory
      );
      return {
        message: responseText,
        metadata: {
          usedFinancialData: true,
          provider: 'groq',
          model: env.AI_MODEL || 'llama-3.3-70b-versatile',
        },
      };
    } catch (err) {
      console.warn('Groq call failed, falling back to deterministic financial engine:', err);
    }
  }

  // 4. Deterministic Financial Reasoning Synthesis (100% accurate fallback)
  const syntheticMessage = generateDeterministicFinancialResponse(userMessage, financialContext);
  return {
    message: syntheticMessage,
    metadata: {
      usedFinancialData: true,
      provider: 'spendwise-financial-engine',
    },
  };
}
