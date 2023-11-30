import ServerPlots from "./plots/ServerPlots";
import BuildEvent from "./network/event/BuildEvent";
import DeleteEvent from "./network/event/DeleteEvent";
import RideStartEvent from "./network/event/RideStartEvent";
import MoveEvent from "./network/event/MoveEvent";
import ConfigEvent from "./network/event/ConfigEvent";
import PlayerCache from "./PlayerCache";
import SaveSlotEvent from "./network/event/SaveSlotEvent";
import FetchSlotEvent from "./network/event/FetchSlotsEvent";
import BlocksLogic from "./blocks/BlocksLogic";
import LoadSlotEvent from "./network/event/LoadSlotEvent";

// Plots
ServerPlots.initialize();

// Initializing event workders
BuildEvent.initialize();
MoveEvent.initialize();
DeleteEvent.initialize();
RideStartEvent.initialize();
SaveSlotEvent.initialize();
LoadSlotEvent.initialize();
ConfigEvent.initialize();
FetchSlotEvent.initialize();

// Initializing other
PlayerCache.initialize();
BlocksLogic.initialize();
//PlayerDatabase.initialize();
