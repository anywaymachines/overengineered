import { MarketplaceService, Players } from "@rbxts/services";
import Control from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import GameDefinitions from "shared/data/GameDefinitions";
import ObservableValue from "shared/event/ObservableValue";

export type MaterialChooserDefinition = GuiObject & {
	GetChildren(undefined: undefined): readonly ImageButton[];
};
/** Material chooser part */
export default class MaterialChooser extends Control<MaterialChooserDefinition> {
	readonly value = new ObservableValue<Enum.Material>(Enum.Material.Plastic);

	constructor(gui: MaterialChooserDefinition) {
		super(gui);

		for (const instance of this.gui.GetChildren(undefined)) {
			if (!instance.IsA("ImageButton")) continue;

			if (instance.Name === "Neon") {
				if (
					MarketplaceService.UserOwnsGamePassAsync(
						Players.LocalPlayer.UserId,
						GameDefinitions.GAMEPASSES.NeonMaterial,
					)
				) {
					const lockFrame = instance.FindFirstChild("Lock") as Frame;
					lockFrame.Visible = false;

					const price = MarketplaceService.GetProductInfo(
						GameDefinitions.GAMEPASSES.NeonMaterial,
					).PriceInRobux;
					const priceLabel = instance.FindFirstChild("Lock")?.FindFirstChild("TextLabel") as TextLabel;
					priceLabel.Text = `${price} R$`;
				} else {
					const btn = this.add(new ButtonControl(instance));

					this.event.subscribe(btn.activated, () => {
						// TODO: Update buttons on purchase complete
						MarketplaceService.PromptGamePassPurchase(
							Players.LocalPlayer,
							GameDefinitions.GAMEPASSES.NeonMaterial,
						);
					});

					continue;
				}
			}

			const material = Enum.Material.GetEnumItems().find((m) => m.Name === instance.Name);
			if (!material) throw `Unknown material ${instance.Name}`;

			const btn = this.add(new ButtonControl(instance));
			this.event.subscribe(btn.activated, () => this.value.set(material));
		}
	}
}
