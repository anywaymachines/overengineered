import BlockLogicRemoteHandler from "./blocks/BlockLogicRemoteHandler";
import PlayModeController from "./modes/PlayModeController";
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
BuildRemoteHandler.init();
MoveRemoteHandler.init();
DeleteRemoteHandler.init();
SetPlayModeRemoteHandler.init();
SaveSlotRemoteHandler.init();
LoadSlotRemoteHandler.init();
ConfigRemoteHandler.init();
FetchSlotsRemoteHandler.init();
PlayerSettingsHandler.init();
BlockLogicRemoteHandler.init();

PlayModeController.init();
