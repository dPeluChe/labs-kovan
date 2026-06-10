import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findBestMatch } from "./fuzzyMatch";

const ACTIVITY_MATCH_THRESHOLD = 0.6;

export const getHouseholdRankingTool: ToolDefinition = {
    name: "getHouseholdRanking",
    description: "Consultar el ranking semanal de tareas del hogar (quién lleva más puntos esta semana). Usa esto cuando pregunten quién va ganando o cómo va la competencia del hogar.",
    parameters: {
        type: "object" as const,
        properties: {},
        required: []
    }
};

export async function handleGetHouseholdRanking(context: ToolContext) {
    const { leaderboard, totalActivities, totalPoints } = await context.ctx.runQuery(
        api.household.getWeeklyLeaderboard,
        {
            sessionToken: context.sessionToken,
            familyId: context.familyId
        }
    );

    if (leaderboard.length === 0 || totalActivities === 0) {
        return { success: true, message: "Nadie ha registrado actividades del hogar esta semana." };
    }

    const medals = ["🥇", "🥈", "🥉"];
    const lines = leaderboard.map((entry, index) => {
        const medal = medals[index] ?? `${index + 1}.`;
        return `${medal} ${entry.userName}: ${entry.points} pts (${entry.activities} actividades)`;
    });

    return {
        success: true,
        message: `Ranking semanal del hogar:\n${lines.join("\n")}\nTotal de la semana: ${totalPoints} pts en ${totalActivities} actividades.`
    };
}

export const logHouseholdActivityTool: ToolDefinition = {
    name: "logHouseholdActivity",
    description: "Registrar que el usuario completó una actividad del hogar (lavar platos, cocinar, ir al super, etc.) para sumar puntos al ranking semanal. La actividad debe existir en el catálogo de la familia.",
    parameters: {
        type: "object" as const,
        properties: {
            activityName: {
                type: "string" as const,
                description: "Nombre de la actividad realizada (ej: 'Lavar platos', 'Cocinar', 'Sacar la basura')"
            },
            notes: {
                type: "string" as const,
                description: "Notas adicionales (opcional)"
            }
        },
        required: ["activityName"]
    }
};

export async function handleLogHouseholdActivity(context: ToolContext, args: Record<string, unknown>) {
    const { activityName, notes } = args as { activityName: string; notes?: string };

    const activities = await context.ctx.runQuery(api.household.getActivities, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    const activity = findBestMatch(activityName, activities, (a) => a.name, ACTIVITY_MATCH_THRESHOLD);
    if (!activity) {
        const available = activities.length > 0
            ? ` Actividades disponibles: ${activities.map((a) => a.name).join(", ")}.`
            : " La familia aún no tiene actividades configuradas en /household.";
        return {
            success: false,
            message: `No encontré la actividad "${activityName}".${available}`
        };
    }

    await context.ctx.runMutation(api.household.logActivity, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        activityId: activity._id,
        userId: context.userId,
        notes
    });

    return {
        success: true,
        message: `${activity.emoji} Registrado: ${activity.name} (+${activity.points} pts).`
    };
}
