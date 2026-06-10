import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

const ROLE_LABEL: Record<string, string> = {
    admin: "admin",
    member: "miembro",
};

export const listFamilyMembersTool: ToolDefinition = {
    name: "listFamilyMembers",
    description: "Listar los miembros de la familia (nombres y roles). Usa esto para desambiguar nombres antes de asignar regalos, actividades del hogar o registros de salud.",
    parameters: {
        type: "object" as const,
        properties: {},
        required: []
    }
};

export async function handleListFamilyMembers(context: ToolContext) {
    const members = await context.ctx.runQuery(api.families.getFamilyMembers, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    const active = members.filter((m) => m && m.status === "active");
    if (active.length === 0) {
        return { success: true, message: "No hay miembros activos en la familia." };
    }

    const lines = active.map((member) => {
        const isCaller = member!._id === context.userId ? " (quien te habla)" : "";
        return `- ${member!.name} (${ROLE_LABEL[member!.role] ?? member!.role})${isCaller}`;
    });

    return {
        success: true,
        message: `Miembros de la familia (${active.length}):\n${lines.join("\n")}`
    };
}
