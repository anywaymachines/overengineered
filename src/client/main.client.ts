import PlayerStateEvent from "./event/PlayerStateEvent";
import ToolbarControl, { ToolbarControlDefinition } from "./gui/controls/ToolbarControl";
import ToolSceneController from "./gui/scenes/ToolSceneController";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import LogControl from "./gui/static/LogControl";
import { ActionBarControl } from "./gui/static/ActionBarControl";
import TooltipsControl from "./gui/static/TooltipsControl";

ToolSceneController.init();
ActionBarControl.instance.setVisible(true);
TooltipsControl.instance.setVisible(true);

PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

ToolbarControl.instance.setVisible(true);
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
