import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findAllMatches, findBestMatch } from "./fuzzyMatch";

type ContactCategory =
    | "doctor"
    | "veterinarian"
    | "mechanic"
    | "plumber"
    | "electrician"
    | "dentist"
    | "emergency"
    | "other";

const CONTACT_CATEGORIES = [
    "doctor",
    "veterinarian",
    "mechanic",
    "plumber",
    "electrician",
    "dentist",
    "emergency",
    "other",
] as const;

const SEARCH_THRESHOLD = 0.5;
const DUPLICATE_THRESHOLD = 0.85;

const CATEGORY_LABEL: Record<ContactCategory, string> = {
    doctor: "doctor",
    veterinarian: "veterinario",
    mechanic: "mecánico",
    plumber: "plomero",
    electrician: "electricista",
    dentist: "dentista",
    emergency: "emergencia",
    other: "otro",
};

type Contact = {
    name: string;
    category: ContactCategory;
    specialty?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    isFavorite?: boolean;
};

function formatContact(contact: Contact): string {
    const details = [
        contact.specialty,
        contact.phone ? `tel ${contact.phone}` : undefined,
        contact.email,
        contact.address,
    ].filter(Boolean).join(" · ");
    const favorite = contact.isFavorite ? " ⭐" : "";
    return `- ${contact.name} (${CATEGORY_LABEL[contact.category] ?? contact.category})${favorite}${details ? `: ${details}` : ""}`;
}

export const searchContactsTool: ToolDefinition = {
    name: "searchContacts",
    description: "Buscar en el directorio de contactos de la familia (doctores, veterinarios, mecánicos, plomeros, etc.). Usa esto cuando pidan el teléfono o datos de alguien del directorio. Sin argumentos lista todo el directorio.",
    parameters: {
        type: "object" as const,
        properties: {
            query: {
                type: "string" as const,
                description: "Nombre o especialidad a buscar (opcional, fuzzy match)"
            },
            category: {
                type: "string" as const,
                description: "Filtrar por categoría (opcional)",
                enum: [...CONTACT_CATEGORIES]
            }
        },
        required: []
    }
};

export async function handleSearchContacts(context: ToolContext, args: Record<string, unknown>) {
    const { query, category } = args as { query?: string; category?: ContactCategory };

    const contacts: Contact[] = await context.ctx.runQuery(api.contacts.getContacts, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    let results = category ? contacts.filter((c) => c.category === category) : contacts;

    if (query) {
        // Cada contacto puntúa por su mejor campo (nombre o especialidad)
        const matches = findAllMatches(
            query,
            results,
            (c) => [c.name, c.specialty].filter(Boolean).join(" "),
            SEARCH_THRESHOLD,
            10
        );
        results = matches.map((m) => m.item);
    }

    if (results.length === 0) {
        const scope = [query && `"${query}"`, category && `categoría ${CATEGORY_LABEL[category] ?? category}`]
            .filter(Boolean).join(", ");
        return {
            success: true,
            message: scope
                ? `No encontré contactos para ${scope}. El directorio tiene ${contacts.length} contactos.`
                : "El directorio de contactos está vacío."
        };
    }

    return {
        success: true,
        message: `Contactos (${results.length}):\n${results.map(formatContact).join("\n")}`
    };
}

export const addContactTool: ToolDefinition = {
    name: "addContact",
    description: "Agregar un contacto al directorio familiar (doctor, veterinario, mecánico, plomero, etc.).",
    parameters: {
        type: "object" as const,
        properties: {
            name: {
                type: "string" as const,
                description: "Nombre del contacto"
            },
            category: {
                type: "string" as const,
                description: "Categoría del contacto",
                enum: [...CONTACT_CATEGORIES]
            },
            specialty: {
                type: "string" as const,
                description: "Especialidad (ej: 'Pediatra', 'Transmisiones') (opcional)"
            },
            phone: {
                type: "string" as const,
                description: "Teléfono (opcional)"
            },
            email: {
                type: "string" as const,
                description: "Email (opcional)"
            },
            address: {
                type: "string" as const,
                description: "Dirección (opcional)"
            },
            notes: {
                type: "string" as const,
                description: "Notas adicionales (opcional)"
            },
            allowDuplicate: {
                type: "boolean" as const,
                description: "Permitir agregar aunque exista un contacto con nombre muy similar. SOLO usar true cuando el usuario confirme que es una persona distinta."
            }
        },
        required: ["name", "category"]
    }
};

export async function handleAddContact(context: ToolContext, args: Record<string, unknown>) {
    const { name, category, specialty, phone, email, address, notes, allowDuplicate } = args as {
        name: string;
        category: ContactCategory;
        specialty?: string;
        phone?: string;
        email?: string;
        address?: string;
        notes?: string;
        allowDuplicate?: boolean;
    };

    if (!allowDuplicate) {
        const contacts: Contact[] = await context.ctx.runQuery(api.contacts.getContacts, {
            sessionToken: context.sessionToken,
            familyId: context.familyId
        });
        const duplicate = findBestMatch(name, contacts, (c) => c.name, DUPLICATE_THRESHOLD);
        if (duplicate) {
            return {
                success: false,
                message: `Ya existe el contacto "${duplicate.name}" (${CATEGORY_LABEL[duplicate.category] ?? duplicate.category}). Confirma con el usuario si es la misma persona; si es alguien distinto, vuelve a llamar con allowDuplicate=true.`
            };
        }
    }

    await context.ctx.runMutation(api.contacts.createContact, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        name,
        category,
        specialty,
        phone,
        email,
        address,
        notes,
    });

    return { success: true, message: `Contacto guardado: ${name} (${CATEGORY_LABEL[category] ?? category}).` };
}
