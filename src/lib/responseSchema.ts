import { z } from "zod";

export const responseSchema = {
  tables_user: z.object({
    table: z.string().describe("The table name"),
    summary: z.string().describe("The summary of the table"),
  }),
  talkingPoints_user: z.object({
    talkingPoints: z
      .array(z.string())
      .describe("Array of talking points for the video"),
  }),
  titles_user: z.object({
    titles: z
      .array(z.string())
      .describe("Array of titles based on the talking points"),
  }),
  outro_user: z.object({
    outro: z
      .string()
      .describe("Outro talking points based on the contents of the video"),
  }),
  videoMetadata_user: z.object({
    width: z.number().describe("Width of the video in pixels"),
    height: z.number().describe("Height of the video in pixels"),
    color: z
      .object({
        accentColor: z
          .string()
          .describe("Accent color of the video in hex code"),
        gradientStartColor: z
          .string()
          .optional()
          .describe("Starting color of the gradient in hex code"),
        gradientEndColor: z
          .string()
          .optional()
          .describe("Ending color of the gradient in hex code"),
      })
      .describe("Color scheme for the video"),
    topic: z.string().describe("Topic of the video"),
    description: z.string().describe("Simple description for the video"),
    title: z.string().describe("Incentivizing title for the video"),
    durationInSeconds: z
      .number()
      .describe("Desired duration of the video in seconds"),
    style: z
      .enum(["fun", "professional", "normal"])
      .describe("Style of the video"),
    graphic: z
      .object({
        topic: z.string().describe("Topic of the graph/chart"),
        type: z
          .enum([
            "line-graph",
            "histogram",
            "curve-graph",
            "bar-graph",
            "pie-chart",
          ])
          .describe("Type of graph/chart"),
      })
      .optional()
      .describe("Optional graph/chart to be included"),
    table: z
      .object({
        label: z.string().describe("Short label of what the table represents"),
      })
      .optional()
      .describe("Optional table to be included"),
  }),
  intro_user: z.object({
    intro: z.string().describe("Introduction to the video"),
  }),
};
