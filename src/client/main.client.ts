import PlayerStateEvent from "./event/PlayerStateEvent";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import LogControl from "./gui/static/LogControl";
import TooltipsControl from "./gui/static/TooltipsControl";
import Main from "./Main";
import ActionController from "./controller/ActionController";
import SavePopup from "./gui/popup/SavePopup";
import Signal from "@rbxts/signal";
import Remotes from "shared/Remotes";
import Serializer from "shared/Serializer";

Main.instance.show();
TooltipsControl.instance.show();
LogControl.instance.show();

ActionController.init();
PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

SavePopup.instance.show();

(async () => {
	const msadnhfkjsadsadasd = await Remotes.Client.GetNamespace("Slots").Get("Fetch").CallServerAsync();

	SavePopup.instance.data.set({
		purchasedSlots: msadnhfkjsadsadasd.purchasedSlots,
		slots: msadnhfkjsadsadasd.slots.map((slot) => {
			return {
				...slot,
				updated: new Signal<() => void>(),
				color: Serializer.Color3Serializer.deserialize(slot.color),
			};
		}),
	});
})();
