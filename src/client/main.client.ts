import ComponentContainer from "./base/ComponentContainer";
import LogicRegistry from "./blocks/LogicRegistry";
import ActionController from "./controller/ActionController";
import GameEnvironmentController from "./controller/GameEnvironmentController";
import GuiController from "./controller/GuiController";
import LocalPlayerController from "./controller/LocalPlayerController";
import PlayModeController from "./controller/PlayModeController";
import SoundController from "./controller/SoundController";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import TestScene, { TestSceneDefinition } from "./gui/scenes/TestScene";
import DebugControl from "./gui/static/DebugControl";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";

GameEnvironmentController.initialize();

TooltipsControl.instance.show();
LogControl.instance.show();

ActionController.init();
LocalPlayerController.initialize();
InputTypeChangeEvent.subscribe();

LogicRegistry.initialize();
DebugControl.instance.show();
SoundController.initialize();

const root = new ComponentContainer();
root.add(new PlayModeController());
root.enable();

const guitests = new TestScene(GuiController.getGameUI<{ Tests: TestSceneDefinition }>().Tests);
// guitests.show();
