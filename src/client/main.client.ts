import PlayerStateEvent from "./event/PlayerStateEvent";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";
import ActionController from "./controller/ActionController";
import LogicRegistry from "./blocks/LogicRegistry";
import TestScene, { TestSceneDefinition } from "./gui/scenes/TestScene";
import GuiController from "./controller/GuiController";
import GameEnvironmentController from "./controller/GameEnvironmentController";
import DebugControl from "./gui/static/DebugControl";
import ComponentContainer from "./base/ComponentContainer";
import PlayModeController from "./controller/PlayModeController";

GameEnvironmentController.initialize();

TooltipsControl.instance.show();
LogControl.instance.show();

ActionController.init();
PlayerStateEvent.initialize();
InputTypeChangeEvent.subscribe();

LogicRegistry.initialize();
DebugControl.instance.show();

const root = new ComponentContainer();
root.add(new PlayModeController());
root.enable();

const guitests = new TestScene(GuiController.getGameUI<{ Tests: TestSceneDefinition }>().Tests);
// guitests.show();
