import { MarketplaceService, Players } from "@rbxts/services";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { ObservableValue } from "shared/event/ObservableValue";

class MaterialButton extends ButtonControl {
	constructor(gui: GuiButton, set: (material: Enum.Material) => void, gamePass?: number) {
		super(gui);

		const material = Enum.Material.GetEnumItems().find((m) => m.Name === gui.Name);
		if (!material) throw `Unknown material ${gui.Name}`;

		let bought = gamePass === undefined;
		this.event.subscribe(this.activated, () => {
			if (!bought) return;
			set(material);
		});

		if (gamePass !== undefined) {
			const lockFrame = gui.FindFirstChild("Lock") as Frame;
			const priceLabel = lockFrame.FindFirstChild("TextLabel") as TextLabel;

			if (MarketplaceService.UserOwnsGamePassAsync(Players.LocalPlayer.UserId, gamePass)) {
				bought = true;
				lockFrame.Visible = false;
			} else {
				const price = MarketplaceService.GetProductInfo(gamePass, Enum.InfoType.GamePass).PriceInRobux ?? "N/A";
				priceLabel.Text = `${price} R$`;
				lockFrame.Visible = true;

				MarketplaceService.PromptGamePassPurchaseFinished.Connect((player, gamePassId, wasPurchased) => {
					if (!wasPurchased) return;
					if (gamePassId !== gamePass) return;

					bought = true;
					lockFrame.Visible = false;
					set(material);
				});

				this.event.subscribe(this.activated, () => {
					if (bought) return;
					MarketplaceService.PromptGamePassPurchase(Players.LocalPlayer, gamePass);
				});
			}
		}
	}
}

export type MaterialChooserDefinition = GuiObject & {
	GetChildren(undefined: undefined): readonly ImageButton[];
};
/** Material chooser part */
export class MaterialChooser extends Control<MaterialChooserDefinition> {
	readonly value = new ObservableValue<Enum.Material>(Enum.Material.Plastic);

	constructor(gui: MaterialChooserDefinition) {
		super(gui);

		for (const instance of this.gui.GetChildren(undefined)) {
			if (!instance.IsA("ImageButton")) continue;

			const gamepassid =
				instance.Name === "Neon"
					? GameDefinitions.GAMEPASSES.NeonMaterial //
					: undefined;

			this.add(new MaterialButton(instance, (material) => this.value.set(material), gamepassid));
		}
	}
}
