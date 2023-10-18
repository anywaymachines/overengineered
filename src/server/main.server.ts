import ServerPlotsController from "./ServerPlotsController";
import BuildEvent from "./building/BuilldEvent";
import SharedLoader from "shared/Loader";

// Initializing shared components
SharedLoader.load();

// Plots
ServerPlotsController.initialize();

// Initializing client-side components
BuildEvent.initialize();
