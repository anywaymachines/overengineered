import PlayerStateEvent from "./event/PlayerStateEvent";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";
import Animation from "./gui/Animation";
import Main from "./Main";
import ActionController from "./controller/ActionController";
import SavePopup from "./gui/popup/SavePopup";

Main.instance.show();
TooltipsControl.instance.show();
LogControl.instance.show();

ActionController.init();
PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

SavePopup.instance.show();
SavePopup.instance.data.set({
	additionalSaveSlots: 123,
	slots: [
		{
			color: [255, 0, 255],
			name: "aboba",
			blocks: 45,
		},
		{
			color: [0, 0, 255],
			name: "abeba",
			blocks: 256,
		},
	],
});

//
//
// testing
/*const anim = Animation.builder(Main.instance.getGui().BuildingMode)
	.resetProperties(["Position"])
	.tween({ Position: Main.instance.getGui().BuildingMode.Position.add(new UDim2(1, 0, 1, 0)) }, new TweenInfo(1))
	.build();

//anim.run();
spawn(() => {
	wait(2);
	print("res!");
	anim.run();
});
*/
