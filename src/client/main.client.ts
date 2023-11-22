import PlayerStateEvent from "./event/PlayerStateEvent";
import ToolbarControl, { ToolbarControlDefinition } from "./gui/controls/ToolbarControl";
import ToolController from "./tools/ToolController";
import ToolSceneController from "./gui/scenes/ToolSceneController";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";

const gameui = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui").WaitForChild("GameUI");

ToolController.init();
ToolSceneController.init();

PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

const tb = new ToolbarControl(
	gameui.WaitForChild("BuildingMode").WaitForChild("ToolbarGui") as ToolbarControlDefinition,
);
tb.setVisible(true);

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
