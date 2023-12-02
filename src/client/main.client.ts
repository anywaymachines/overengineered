import PlayerStateEvent from "./event/PlayerStateEvent";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";
import Main from "./Main";
import ActionController from "./controller/ActionController";
import LogicRegistry from "./blocks/LogicRegistry";
import TestScene, { TestSceneDefinition } from "./gui/scenes/TestScene";
import GuiController from "./controller/GuiController";
import GameEnvironmentController from "./controller/GameEnvironmentController";
import RideMode from "./controller/modes/RideMode";

GameEnvironmentController.initialize();

Main.instance.show();
TooltipsControl.instance.show();
LogControl.instance.show();

ActionController.init();
PlayerStateEvent.initialize();
InputTypeChangeEvent.subscribe();

LogicRegistry.initialize();

RideMode.initialize();

const guitests = new TestScene(GuiController.getGameUI<{ Tests: TestSceneDefinition }>().Tests);
// guitests.show();
