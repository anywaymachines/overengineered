import ClientBuildingController from "./building/ClientBuildingController";
import SharedManager from "shared/SharedManager";

// Initializing shared components
SharedManager.initialize();

// Initializing client-side components
ClientBuildingController.initialize();

// Test function
ClientBuildingController.startBuilding();
