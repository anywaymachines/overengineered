import BlocksLogic from "./blocks/BlocksLogic";
import BuildRemoteHandler from "./network/event/BuildRemoteHandler";
import ConfigRemoteHandler from "./network/event/ConfigRemoteHandler";
import DeleteRemoteHandler from "./network/event/DeleteRemoteHandler";
import FetchSlotsRemoteHandler from "./network/event/FetchSlotsRemoteHandler";
import LoadSlotRemoteHandler from "./network/event/LoadSlotRemoteHandler";
import MoveRemoteHandler from "./network/event/MoveRemoteHandler";
import PlayerSettingsHandler from "./network/event/PlayerSettingsHandler";
import SaveSlotRemoteHandler from "./network/event/SaveSlotRemoteHandler";
import SetPlayModeRemoteHandler from "./network/event/SetPlayModeRemoteHandler";
import ServerPlots from "./plots/ServerPlots";

// Plots
ServerPlots.initialize();

// Initializing event workders
new BuildRemoteHandler();
new MoveRemoteHandler();
new DeleteRemoteHandler();
new SetPlayModeRemoteHandler();
new SaveSlotRemoteHandler();
new LoadSlotRemoteHandler();
new ConfigRemoteHandler();
new FetchSlotsRemoteHandler();
new PlayerSettingsHandler();

// Initializing other
BlocksLogic.initialize();
