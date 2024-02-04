import Control from "client/gui/Control";
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

			const material = Enum.Material.GetEnumItems().find((m) => m.Name === instance.Name);
			if (!material) throw `Unknown material ${instance.Name}`;

			this.event.subscribe(instance.Activated, () => {
				this.value.set(material);
			});
		}
	}
}
