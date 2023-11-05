import ServerPlots from "./building/ServerPlots";
import BuildEvent from "./building/BuilldEvent";
import DeleteEvent from "./building/DeleteEvent";
import RideStartEvent from "./ride/RideStartEvent";

// Plots
ServerPlots.initialize();

// Initializing event workders
BuildEvent.initialize();
DeleteEvent.initialize();
RideStartEvent.initialize();
