import SceneController from "./controller/SceneController";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import PlayerStateEvent from "./event/PlayerStateEvent";

// Events
PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

// Init
SceneController.init();

PlayerStateEvent.emitPlayerSpawn();
