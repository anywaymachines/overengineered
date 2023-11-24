import PlayerStateEvent from "./event/PlayerStateEvent";
import ToolbarControl, { ToolbarControlDefinition } from "./gui/controls/ToolbarControl";
import ToolSceneController from "./gui/scenes/ToolSceneController";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import LogControl from "./gui/static/LogControl";

ToolSceneController.init();

PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

ToolbarControl.instance.setVisible(true);
LogControl.instance.setVisible(true);

/*
import StaticWidgetsController from "./controller/StaticWidgetsController";
import TooltipController from "./controller/TooltipController";
import PlayerStateEvent from "./event/PlayerStateEvent";
import ActionController from "./controller/ActionController";
import BuildingWelder from "./BuildingWelder";
import InputController from "./controller/InputController";
import Remotes from "shared/Remotes";



// Init
StaticWidgetsController.init();
TooltipController.init();
ActionController.init();
BuildingWelder.init(); // TODO: Move to server

// Events
PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();
*/
