/// <reference types="@rbxts/testez/globals" />

import PlayerGameUI from "client/gui/PlayerGameUI";
import GuiUtils from "client/utils/GuiUtils";

// TODO: Write my own unit tester using roblox studio plugin
export = () => {
	describe("(Client) Retrieving UI", () => {
		it("PlayerGUI", () => {
			GuiUtils.getPlayerGui();
		});
		it("GameUI", () => {
			GuiUtils.getGameUI();
		});
	});

	describe("(Client) Testing tools", () => {
		PlayerGameUI.ToolsGUI.tools.forEach((tool) => {
			it(`Getting button tooltips for ${tool.getDisplayName()}`, () => {
				tool.getGamepadTooltips();
				tool.getKeyboardTooltips();
			});

			it(`Equipping ${tool.getDisplayName()}`, () => {
				tool.onEquip();
			});

			it(`Changing platform for ${tool.getDisplayName()}`, () => {
				tool.onPlatformChanged("Mobile");
			});

			it(`Unequipping ${tool.getDisplayName()}`, () => {
				tool.onUnequip();
			});
		});
		PlayerGameUI.ToolsGUI.equipTool();
	});
};
