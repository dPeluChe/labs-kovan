// Central export file for all agent tools
export * from "./tools.types";
export * from "./tools.finances";
export * from "./tools.collections";
export * from "./tools.places";
export * from "./tools.recipes";
export * from "./tools.vehicles";
export * from "./tools.gifts";
export * from "./tools.tasks";
export * from "./tools.calendar";
export * from "./tools.health";
export * from "./tools.subscriptions";
export * from "./tools.household";
export * from "./tools.trips";
export * from "./tools.diary";
export * from "./tools.overview";
export * from "./tools.contacts";
export * from "./tools.documents";
export * from "./tools.family";

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
import {
    addPlaceTool, handleAddPlace,
    getPlacesTool, handleGetPlaces,
    registerPlaceVisitTool, handleRegisterPlaceVisit
} from "./tools.places";
import {
    addRecipeTool, handleAddRecipe,
    listRecipesTool, handleListRecipes
} from "./tools.recipes";
import {
    addVehicleEventTool, handleAddVehicleEvent,
    listVehiclesTool, handleListVehicles,
    getVehicleRemindersTool, handleGetVehicleReminders
} from "./tools.vehicles";
import {
    searchContactsTool, handleSearchContacts,
    addContactTool, handleAddContact
} from "./tools.contacts";
import { getExpiringDocumentsTool, handleGetExpiringDocuments } from "./tools.documents";
import { listFamilyMembersTool, handleListFamilyMembers } from "./tools.family";
import {
    createGiftEventTool, handleCreateGiftEvent,
    addGiftToEventTool, handleAddGiftToEvent,
    updateGiftStatusTool, handleUpdateGiftStatus,
    getGiftsForEventTool, handleGetGiftsForEvent,
    getGiftsForPersonTool, handleGetGiftsForPerson,
    updateGiftItemTool, handleUpdateGiftItem
} from "./tools.gifts";
import {
    listTasksTool, handleListTasks,
    addTaskTool, handleAddTask,
    completeTaskTool, handleCompleteTask
} from "./tools.tasks";
import { getUpcomingEventsTool, handleGetUpcomingEvents } from "./tools.calendar";
import { getHealthSummaryTool, handleGetHealthSummary } from "./tools.health";
import { getSubscriptionsTool, handleGetSubscriptions } from "./tools.subscriptions";
import {
    getHouseholdRankingTool, handleGetHouseholdRanking,
    logHouseholdActivityTool, handleLogHouseholdActivity
} from "./tools.household";
import { getTripsTool, handleGetTrips } from "./tools.trips";
import { addDiaryEntryTool, handleAddDiaryEntry } from "./tools.diary";
import { getFamilyOverviewTool, handleGetFamilyOverview } from "./tools.overview";

// Combined registry of all tools
export const allToolDefinitions: ToolDefinition[] = [
    // Overview
    getFamilyOverviewTool,

    // Read tools
    getExpenseSummaryTool,
    getLoansTool,
    getCollectionsTool,
    listVehiclesTool,
    getVehicleRemindersTool,
    listTasksTool,
    getUpcomingEventsTool,
    getHealthSummaryTool,
    getSubscriptionsTool,
    getHouseholdRankingTool,
    getTripsTool,
    searchContactsTool,
    getPlacesTool,
    listRecipesTool,
    getExpiringDocumentsTool,
    listFamilyMembersTool,

    // Write tools
    registerExpenseTool,
    registerLoanTool,
    addToCollectionTool,
    addPlaceTool,
    registerPlaceVisitTool,
    addContactTool,
    addRecipeTool,
    addVehicleEventTool,
    addTaskTool,
    completeTaskTool,
    logHouseholdActivityTool,
    addDiaryEntryTool,

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
    getFamilyOverview: handleGetFamilyOverview,
    getExpenseSummary: handleGetExpenseSummary,
    getLoans: handleGetLoans,
    getCollections: handleGetCollections,
    listVehicles: handleListVehicles,
    listTasks: handleListTasks,
    getUpcomingEvents: handleGetUpcomingEvents,
    getHealthSummary: handleGetHealthSummary,
    getSubscriptions: handleGetSubscriptions,
    getHouseholdRanking: handleGetHouseholdRanking,
    getTrips: handleGetTrips,
    getVehicleReminders: handleGetVehicleReminders,
    searchContacts: handleSearchContacts,
    getPlaces: handleGetPlaces,
    listRecipes: handleListRecipes,
    getExpiringDocuments: handleGetExpiringDocuments,
    listFamilyMembers: handleListFamilyMembers,
    registerExpense: handleRegisterExpense,
    registerLoan: handleRegisterLoan,
    addToCollection: handleAddToCollection,
    addPlace: handleAddPlace,
    registerPlaceVisit: handleRegisterPlaceVisit,
    addContact: handleAddContact,
    addRecipe: handleAddRecipe,
    addVehicleEvent: handleAddVehicleEvent,
    addTask: handleAddTask,
    completeTask: handleCompleteTask,
    logHouseholdActivity: handleLogHouseholdActivity,
    addDiaryEntry: handleAddDiaryEntry,
    createGiftEvent: handleCreateGiftEvent,
    addGiftToEvent: handleAddGiftToEvent,
    updateGiftStatus: handleUpdateGiftStatus,
    getGiftsForEvent: handleGetGiftsForEvent,
    getGiftsForPerson: handleGetGiftsForPerson,
    updateGiftItem: handleUpdateGiftItem,
};
