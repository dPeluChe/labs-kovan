# Refactoring UI Components Summary

## Completed Tasks
- **Select Component**: Updated to accept `children` for options, standardized API with `Input`.
- **ResourceCard**: Created and integrated into `VehiclesPage`, `PetsPage`, `HealthPage`, and `DocumentsPage`.
- **HorizontalSelector**: Created and integrated into `DocumentsPage`.
- **FinancesPage**: Refactored `NewSubscriptionModal`, `NewLoanModal`, `PaySubscriptionModal` to use `Input` and `Select`.
- **TripsPage**: Refactored to use `AnimatedTabs`.
- **Lint Fixes**: Resolved unused variables/imports in `ResourceCard`, `HealthPage`, and `HorizontalSelector`.

## Identified Reusable Components
- **Input**: Standardized text/number inputs.
- **Select**: Standardized select dropdowns.
- **ResourceCard**: Standardized list items for resources (vehicles, pets, docs).
- **HorizontalSelector**: Standardized scrollable pill-selection lists.
- **AnimatedTabs**: Standardized tab headers.

## Next Steps
- **MorePage**: Consider if any other sections need similar treatment (e.g., `GiftsPage` if it exists and wasn't covered).
- **Contacts/Places**: Re-evaluate if `ResourceCard` fits there.
