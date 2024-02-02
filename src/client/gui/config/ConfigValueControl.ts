import Control from "client/gui/Control";
import Objects from "shared/fixes/objects";
import { ConfigPartDefinition } from "../popup/SettingsPopup";

export class ConfigValueControl<TGui extends GuiObject> extends Control<ConfigPartDefinition<TGui>> {
	constructor(gui: ConfigPartDefinition<TGui>, name: string) {
		super(gui);
		this.gui.HeadingLabel.Text = name;
	}

	protected sameOrUndefined<T>(configs: Readonly<Record<BlockUuid, T>>) {
		let value: T | undefined;
		for (const [_, config] of Objects.pairs(configs)) {
			if (value !== undefined && value !== config) {
				value = undefined;
				break;
			}

			value = config;
		}

		return value;
	}
	protected map<T, TOut>(
		configs: Readonly<Record<BlockUuid, T>>,
		mapfunc: (value: T, key: BlockUuid) => TOut,
	): Readonly<Record<BlockUuid, TOut>> {
		return Objects.fromEntries(Objects.entries(configs).map((e) => [e[0], mapfunc(e[1], e[0])] as const));
	}
}
