import PlayerStateEvent from "./event/PlayerStateEvent";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";
import Main from "./Main";
import ActionController from "./controller/ActionController";
import LogicRegistry from "./blocks/LogicRegistry";
import Signals from "./event/Signals";

Main.instance.show();
TooltipsControl.instance.show();
LogControl.instance.show();

ActionController.init();
PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

LogicRegistry.initialize();
