import ServerPlots from "./plots/ServerPlots";
import BuildEvent from "./network/event/BuildEvent";
import DeleteEvent from "./network/event/DeleteEvent";
import RideStartEvent from "./network/event/RideStartEvent";
import MoveEvent from "./network/event/MoveEvent";
import ConfigEvent from "./network/event/ConfigEvent";
import PlayerCache from "./PlayerCache";
import SaveSlotEvent from "./network/event/SaveSlotEvent";
import FetchSlotEvent from "./network/event/FetchSlotsEvent";

// Plots
ServerPlots.initialize();

// Initializing event workders
BuildEvent.initialize();
MoveEvent.initialize();
DeleteEvent.initialize();
RideStartEvent.initialize();
SaveSlotEvent.initialize();
ConfigEvent.initialize();
FetchSlotEvent.initialize();

// Initializing other
PlayerCache.initialize();
//PlayerDatabase.initialize();
