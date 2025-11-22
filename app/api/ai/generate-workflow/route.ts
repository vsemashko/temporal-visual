import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.LITELLM_API_KEY || "sk-1234567890",
  baseURL: process.env.LITELLM_PROXY_URL || "http://localhost:4000",
});

const GENERATION_PROMPT = `You are an AI that converts natural language descriptions into Temporal workflow node configurations.

Given a user description, generate a JSON array of workflow nodes and edges that can be used in a React Flow diagram.

Node types available:
- start: Entry point (always include one)
- activity: Business logic task
- decision: Conditional branching
- parallel: Concurrent execution
- signal: Wait for external event
- timer: Delay/sleep
- end: Workflow completion

Return ONLY a valid JSON object with this structure:
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "node-type",
      "position": { "x": number, "y": number },
      "data": { ...node-specific-data... }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id"
    }
  ]
}

Example for "process order with payment":
{
  "nodes": [
    { "id": "start-1", "type": "start", "position": { "x": 250, "y": 50 }, "data": { "label": "Start" } },
    { "id": "activity-1", "type": "activity", "position": { "x": 250, "y": 150 }, "data": { "label": "Validate Order", "activityName": "validateOrder", "timeout": "5m" } },
    { "id": "activity-2", "type": "activity", "position": { "x": 250, "y": 250 }, "data": { "label": "Process Payment", "activityName": "processPayment", "timeout": "10m" } },
    { "id": "end-1", "type": "end", "position": { "x": 250, "y": 350 }, "data": { "label": "End" } }
  ],
  "edges": [
    { "id": "e1", "source": "start-1", "target": "activity-1" },
    { "id": "e2", "source": "activity-1", "target": "activity-2" },
    { "id": "e3", "source": "activity-2", "target": "end-1" }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // GPT-4 is better at structured JSON output
      messages: [
        { role: "system", content: GENERATION_PROMPT },
        { role: "user", content: description },
      ],
      max_tokens: 3000,
      temperature: 0.3, // Lower temperature for more consistent output
    });

    const content = response.choices[0]?.message?.content || "{}";

    // Parse the JSON response
    const workflow = JSON.parse(content);

    return NextResponse.json({
      success: true,
      workflow,
    });
  } catch (error: any) {
    console.error("Error generating workflow:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate workflow",
      },
      { status: 500 }
    );
  }
}
