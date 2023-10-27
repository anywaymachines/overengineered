import ServerPlots from "./building/ServerPlots";
import BuildEvent from "./building/BuilldEvent";
import SharedLoader from "shared/SharedLoader";
import DeleteEvent from "./building/DeleteEvent";

// Initializing shared components
SharedLoader.load();

// Plots
ServerPlots.initialize();

// Initializing client-side components
BuildEvent.initialize();
DeleteEvent.initialize();
