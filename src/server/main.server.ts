import ServerPlots from "./building/ServerPlots";
import BuildEvent from "./building/BuilldEvent";
import DeleteEvent from "./building/DeleteEvent";

// Plots
ServerPlots.initialize();

// Initializing client-side components
BuildEvent.initialize();
DeleteEvent.initialize();
