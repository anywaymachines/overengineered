import StaticWidgetsController from "./controller/StaticWidgetsController";
import SceneController from "./controller/SceneController";
import TooltipController from "./controller/TooltipController";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import PlayerStateEvent from "./event/PlayerStateEvent";
import ActionController from "./controller/ActionController";

// Events
PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

// Init
SceneController.init();
StaticWidgetsController.init();
TooltipController.init();
ActionController.init();

PlayerStateEvent.emitPlayerSpawn();
