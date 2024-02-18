import { Players } from "@rbxts/services";
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
			if (instance.Name === "Neon" && !GameDefinitions.isAdmin(Players.LocalPlayer)) {
				instance.Destroy();
				continue;
			}

			const material = Enum.Material.GetEnumItems().find((m) => m.Name === instance.Name);
			if (!material) throw `Unknown material ${instance.Name}`;

			const btn = this.add(new ButtonControl(instance));
			this.event.subscribe(btn.activated, () => this.value.set(material));
		}
	}
}
