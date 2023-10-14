import Logger from "shared/Logger";
import ServerBuildingController from "./building/ServerBuildingController";
import SharedManager from "shared/SharedManager";

// Initializing shared components
SharedManager.initialize();

// Initializing client-side components
ServerBuildingController.initialize();
