import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.LITELLM_API_KEY || "sk-1234567890",
  baseURL: process.env.LITELLM_PROXY_URL || "http://localhost:4000",
});

const SYSTEM_PROMPT = `You are an expert AI assistant for Temporal workflow development. You help users:

1. Design and optimize workflow architectures
2. Generate Temporal TypeScript workflow code
3. Suggest best practices for error handling, retries, and timeouts
4. Debug workflow issues
5. Write activity implementations
6. Recommend patterns for common use cases

When generating workflows, use the Temporal TypeScript SDK syntax and follow these guidelines:
- Use proxyActivities for activity invocations
- Implement proper error handling
- Configure appropriate timeouts
- Use descriptive variable names
- Add helpful comments

Be concise but thorough in your explanations.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const response = await openai.chat.completions.create({
      model: "claude-3-sonnet", // or gpt-4-turbo, claude-3-haiku, etc.
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const message = response.choices[0]?.message?.content || "No response";

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error("Error calling LiteLLM:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get AI response",
      },
      { status: 500 }
    );
  }
}
