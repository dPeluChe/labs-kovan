// Central export file for all agent tools
export * from "./tools.types";
export * from "./tools.finances";
export * from "./tools.collections";
export * from "./tools.places";
export * from "./tools.recipes";
export * from "./tools.vehicles";
export * from "./tools.gifts";

import type { ToolDefinition, ToolHandler } from "./tools.types";
import {
    getExpenseSummaryTool, handleGetExpenseSummary,
    getLoansTool, handleGetLoans,
    registerExpenseTool, handleRegisterExpense,
    registerLoanTool, handleRegisterLoan
} from "./tools.finances";
import {
    getCollectionsTool, handleGetCollections,
    addToCollectionTool, handleAddToCollection
} from "./tools.collections";
import { addPlaceTool, handleAddPlace } from "./tools.places";
import { addRecipeTool, handleAddRecipe } from "./tools.recipes";
import { addVehicleEventTool, handleAddVehicleEvent } from "./tools.vehicles";
import {
    createGiftEventTool, handleCreateGiftEvent,
    addGiftToEventTool, handleAddGiftToEvent,
    updateGiftStatusTool, handleUpdateGiftStatus,
    getGiftsForEventTool, handleGetGiftsForEvent,
    getGiftsForPersonTool, handleGetGiftsForPerson,
    updateGiftItemTool, handleUpdateGiftItem
} from "./tools.gifts";

// Combined registry of all tools
export const allToolDefinitions: ToolDefinition[] = [
    // Read tools
    getExpenseSummaryTool,
    getLoansTool,
    getCollectionsTool,

    // Write tools
    registerExpenseTool,
    registerLoanTool,
    addToCollectionTool,
    addPlaceTool,
    addRecipeTool,
    addVehicleEventTool,

    // Gifts tools
    createGiftEventTool,
    addGiftToEventTool,
    updateGiftStatusTool,
    getGiftsForEventTool,
    getGiftsForPersonTool,
    updateGiftItemTool,
];

// Handler registry
export const toolHandlers: Record<string, ToolHandler> = {
    getExpenseSummary: handleGetExpenseSummary,
    getLoans: handleGetLoans,
    getCollections: handleGetCollections,
    registerExpense: handleRegisterExpense,
    registerLoan: handleRegisterLoan,
    addToCollection: handleAddToCollection,
    addPlace: handleAddPlace,
    addRecipe: handleAddRecipe,
    addVehicleEvent: handleAddVehicleEvent,
    createGiftEvent: handleCreateGiftEvent,
    addGiftToEvent: handleAddGiftToEvent,
    updateGiftStatus: handleUpdateGiftStatus,
    getGiftsForEvent: handleGetGiftsForEvent,
    getGiftsForPerson: handleGetGiftsForPerson,
    updateGiftItem: handleUpdateGiftItem,
};
