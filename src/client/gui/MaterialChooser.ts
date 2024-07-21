import { MarketplaceService, Players } from "@rbxts/services";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { SubmittableValue } from "shared/event/SubmittableValue";
import { Marketplace } from "shared/Marketplace";

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

			if (Marketplace.Gamepass.has(Players.LocalPlayer, gamePass)) {
				bought = true;
				lockFrame.Visible = false;
			} else {
				priceLabel.Text = Marketplace.Gamepass.getPrice(gamePass);
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
	readonly value;

	constructor(gui: MaterialChooserDefinition, value?: SubmittableValue<Enum.Material>) {
		super(gui);

		value ??= SubmittableValue.from<Enum.Material>(Enum.Material.Plastic);
		this.value = value.asHalfReadonly();

		for (const instance of this.gui.GetChildren(undefined)) {
			if (!instance.IsA("ImageButton")) continue;

			const gamepassid = instance.Name === "Neon" ? GameDefinitions.GAMEPASSES.NeonMaterial : undefined;
			this.add(new MaterialButton(instance, (material) => value.submit(material), gamepassid));
		}
	}
}
