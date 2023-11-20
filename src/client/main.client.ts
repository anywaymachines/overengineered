import StaticWidgetsController from "./controller/StaticWidgetsController";
import SceneController from "./controller/SceneController";
import TooltipController from "./controller/TooltipController";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import PlayerStateEvent from "./event/PlayerStateEvent";
import ActionController from "./controller/ActionController";
import BuildingWelder from "./BuildingWelder";
import InputController from "./controller/InputController";
import Remotes from "shared/Remotes";

// Events
PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

// Init
SceneController.init();
StaticWidgetsController.init();
TooltipController.init();
ActionController.init();
BuildingWelder.init();

PlayerStateEvent.emitPlayerSpawn();

// Native input type share
Remotes.Client.GetNamespace("Player").Get("InputTypeInfo").SendToServer(InputController.inputType);
