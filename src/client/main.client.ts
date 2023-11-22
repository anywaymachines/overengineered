import PlayerStateEvent from "./event/PlayerStateEvent";
import SliderControl, { SliderControlDefinition } from "./gui/controls/SliderControl";

const interfaceTest = true;
if (interfaceTest) {
	// const gameui = game.GetService("StarterGui").WaitForChild("GameUI");
	const gameui = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui").WaitForChild("GameUI");
	const uikit = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui").WaitForChild("UIKit");

	new SliderControl(uikit.WaitForChild("Buttons").WaitForChild("Slider") as SliderControlDefinition);

	/*const backpack = new TabControl(
		gameui.WaitForChild("InventoryGui").WaitForChild("Backpack") as TabControlDefinition,
	);

	for (const category of CategoriesRegistry.registeredCategories) {
		const content = new BlockChooserControl(
			backpack.getGuiChild("Content").WaitForChild("Template") as BlockChooserControlDefinition,
			BlockRegistry.getBlocksInCategory(category),
		);

		backpack.addTab(category.getDisplayName(), content);
	}

	backpack.setVisible(true);*/

	PlayerStateEvent.emitPlayerSpawn();
} else {
	/*
import StaticWidgetsController from "./controller/StaticWidgetsController";
import SceneController from "./controller/SceneController";
import TooltipController from "./controller/TooltipController";
import InputTypeChangeEvent from "./event/InputTypeChangeEvent";
import PlayerStateEvent from "./event/PlayerStateEvent";
import ActionController from "./controller/ActionController";
import BuildingWelder from "./BuildingWelder";
import InputController from "./controller/InputController";
import Remotes from "shared/Remotes";

// Events
PlayerStateEvent.subscribe();
InputTypeChangeEvent.subscribe();

// Init
SceneController.init();
StaticWidgetsController.init();
TooltipController.init();
ActionController.init();
BuildingWelder.init();

PlayerStateEvent.emitPlayerSpawn();

// Native input type share
Remotes.Client.GetNamespace("Player").Get("InputTypeInfo").SendToServer(InputController.inputType);
*/
}
