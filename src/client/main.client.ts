import PlayerStateEvent from "./event/PlayerStateEvent";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";
import Animation from "./gui/Animation";
import Main from "./Main";

Main.instance.show();
TooltipsControl.instance.show();
LogControl.instance.show();

PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

//
//
// testing
/*Animation.builder(Main.instance.getGui().BuildingMode)
	.resetProperties(["Position"])
	.tween({ Position: gui.Position.add(new UDim2(1, 0, 1, 0)) }, new TweenInfo(5))
	.build()
	.run();*/
