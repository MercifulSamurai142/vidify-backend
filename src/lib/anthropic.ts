import Instructor from "@instructor-ai/instructor";
import dotenv from "dotenv";
import { createLLMClient } from "llm-polyglot";
import { MessageParam } from "@anthropic-ai/sdk/resources";
import { z } from "zod";

dotenv.config();

const anthropicClient = createLLMClient({
  provider: "anthropic",
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  maxRetries: 3,
});

const instructor = Instructor({
  client: anthropicClient,
  mode: "TOOLS",
});

export async function anthropicCheckModeration(input: string) {
  const policyString = `You will be acting as a content moderator to Flag user queries based on our content policy. Return a JSON with flagged property as true if it violates our content policy. Here is the content policy to follow:

<content_policy>
If the user's request refers to harmful, pornographic, or illegal activities, it violates the policy. If the user's request does not refer to harmful, pornographic, or illegal activities, it does not violated the policy. Reply with JSON object with nothing except the flagged property.
</content_policy>

And here is the chat transcript to review and classify:

<transcript>${input}
</transcript>`;

  try {
    const completion = await instructor.chat.completions.create({
      messages: [{ role: "user", content: policyString }],
      model: "claude-3-haiku-20240307",
      max_tokens: 10,
      temperature: 0,
      response_model: {
        schema: z.object({
          flagged: z.boolean(),
        }),
        name: "Moderation",
      },
    });

    console.log(
      `=====================\nPrompt is ${
        completion.flagged ? "FLAGGED!" : "SAFE."
      }\n=====================`
    );

    return { isFlagged: completion.flagged };
  } catch (error) {
    console.error("Moderation Error: ", error);
  }
}

export async function getAnthropicChatResponse(
  messages: MessageParam[],
  schema: z.ZodSchema<any>,
  schemaName: string
): Promise<string> {
  const anthropicMessages: MessageParam[] = [];
  messages.map((msg) => {
    const temp: MessageParam = {
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    };
    anthropicMessages.push(temp);
  });

  try {
    const completion = await instructor.chat.completions.create({
      model: "claude-2.0",
      messages: anthropicMessages,
      max_tokens: 1024,
      stream: false,
      temperature: 0.8,
      response_model: {
        schema: schema,
        name: schemaName,
      },
      // //   top_p: defaultOpenAIRequest.top_p, // disabled as per the docs recommendation.
      // //   frequency_penalty: defaultOpenAIRequest.frequency_penalty,
      // ...anthropicOptions,
    });
    const result = schema.parse(completion);

    // console.log(`💬 Original AI response: `, completion);

    return result;
  } catch (err: any) {
    console.error(err.response);

    throw `Error while fetching response: ${err}`;
  }
}
