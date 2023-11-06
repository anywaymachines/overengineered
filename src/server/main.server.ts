import ServerPlots from "./plots/ServerPlots";
import BuildEvent from "./network/event/BuildEvent";
import DeleteEvent from "./network/event/DeleteEvent";
import RideStartEvent from "./network/event/RideStartEvent";
import PlotDatabase from "./plots/PlotDatabase";

// Plots
PlotDatabase.initialize();
ServerPlots.initialize();

// Initializing event workders
BuildEvent.initialize();
DeleteEvent.initialize();
RideStartEvent.initialize();
