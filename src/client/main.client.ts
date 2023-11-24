import PlayerStateEvent from "./event/PlayerStateEvent";
import BuildingModeScene from "./gui/scenes/BuildingModeScene";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";
import ConfirmPopup from "./gui/popup/ConfirmPopup";

BuildingModeScene.instance.setVisible(true);
BuildingModeScene.instance.registerPopup(ConfirmPopup.instance);

TooltipsControl.instance.setVisible(true);

PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

LogControl.instance.setVisible(true);

/*
// Init
StaticWidgetsController.init();
TooltipController.init();
ActionController.init();

// Events
PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();
*/
