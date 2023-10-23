import ServerPlots from "./building/ServerPlots";
import BuildEvent from "./building/BuilldEvent";
import SharedLoader from "shared/SharedLoader";

// Initializing shared components
SharedLoader.load();

// Plots
ServerPlots.initialize();

// Initializing client-side components
BuildEvent.initialize();
