import PlayerStateEvent from "./event/PlayerStateEvent";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";
import Animation from "./gui/Animation";
import Main, { MainDefinition } from "./Main";
import GuiController from "./controller/GuiController";

const main = new Main(GuiController.getGameUI<MainDefinition>());
main.show();

TooltipsControl.instance.show();

PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

LogControl.instance.show();

Animation.start();
main.setMode("build");

/*
// Init
StaticWidgetsController.init();
TooltipController.init();
ActionController.init();

// Events
PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();
*/
