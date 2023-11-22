import BlockRegistry from "shared/registry/BlocksRegistry";
import PlayerStateEvent from "./event/PlayerStateEvent";
import BlockChooserControl, { BlockChooserControlDefinition } from "./gui/tools/BlockChooser";
import CategoriesRegistry from "shared/registry/CategoriesRegistry";
import MaterialChooserControl, { MaterialChooserControlDefinition } from "./gui/tools/MaterialChooser";
import BuildingManager from "shared/building/BuildingManager";
import CheckBoxControl, { CheckBoxControlDefinition } from "./gui/controls/CheckBoxControl";
import ToolbarControl, { ToolbarControlDefinition } from "./gui/controls/ToolbarControl";
import ToolController from "./tools/ToolController";

const gameui = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui").WaitForChild("GameUI");
const uikit = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui").WaitForChild("UIKit");

// new SliderControl(uikit.WaitForChild("Buttons").WaitForChild("Slider") as SliderControlDefinition);

ToolController.init();

const bchooser = new BlockChooserControl(
	gameui
		.WaitForChild("BuildingMode")
		.WaitForChild("Tools")
		.WaitForChild("BuildToolGui")
		.WaitForChild("BlockSelection") as BlockChooserControlDefinition,
	BlockRegistry.RegisteredBlocks,
	CategoriesRegistry.registeredCategories,
);
// bchooser.setVisible(true);
// (bchooser.getParent() as GuiObject).Visible = true;

const mchooser = new MaterialChooserControl(
	gameui
		.WaitForChild("BuildingMode")
		.WaitForChild("Popup")
		.WaitForChild("MaterialGui")
		.WaitForChild("Frame") as MaterialChooserControlDefinition,
	BuildingManager.AllowedMaterials,
);
//mchooser.setVisible(true);
//(mchooser.getParent() as GuiObject).Visible = true;

const cb = new CheckBoxControl(
	gameui
		.WaitForChild("BuildingMode")
		.WaitForChild("Tools")
		.WaitForChild("ConfigToolGui")
		.WaitForChild("ParamsSelection")
		.WaitForChild("Buttons")
		.WaitForChild("CheckboxTemplate")
		.WaitForChild("Checkbox") as CheckBoxControlDefinition,
);
cb.setVisible(true);
(cb.getParent() as GuiObject).Visible = true;

const tb = new ToolbarControl(
	gameui.WaitForChild("BuildingMode").WaitForChild("ToolbarGui") as ToolbarControlDefinition,
);
tb.setVisible(true);

PlayerStateEvent.emitPlayerSpawn();

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
