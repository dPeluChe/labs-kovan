import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export interface ToolContext {
    ctx: ActionCtx;
    familyId: Id<"families">;
    userId: Id<"users">;
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties: Record<string, unknown>;
        required: string[];
    };
}

export type ToolHandler = (context: ToolContext, args: Record<string, unknown>) => Promise<{ success: boolean; message: string } | { error: string }>;
