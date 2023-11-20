import ServerPlots from "./plots/ServerPlots";
import BuildEvent from "./network/event/BuildEvent";
import DeleteEvent from "./network/event/DeleteEvent";
import RideStartEvent from "./network/event/RideStartEvent";
import PlotDatabase from "./plots/PlotDatabase";
import MoveEvent from "./network/event/MoveEvent";
import ConfigEvent from "./network/event/ConfigEvent";
import PlayerData from "./PlayerData";

// Plots
PlotDatabase.initialize();
ServerPlots.initialize();

// Initializing event workders
BuildEvent.initialize();
MoveEvent.initialize();
DeleteEvent.initialize();
RideStartEvent.initialize();
ConfigEvent.initialize();

// Initializing other
PlayerData.initialize();
