import { Control } from "client/gui/Control";
import { ConfigPartDefinition } from "client/gui/popup/SettingsPopup";
import { Signal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";

export type ConfigValueControlParams<T extends UnknownConfigType> = {
	readonly configs: Readonly<Record<BlockUuid, T["config"]>>;
	readonly definition: ConfigTypeToDefinition<T>;
};
export class ConfigValueControl<TGui extends GuiObject, TType extends UnknownConfigType> extends Control<
	ConfigPartDefinition<TGui>
> {
	protected readonly _submitted = new Signal<
		(
			config: Readonly<Record<BlockUuid, TType["config"]>>,
			prev: Readonly<Record<BlockUuid, TType["config"]>>,
		) => void
	>();
	readonly submitted = this._submitted.asReadonly();

	constructor(gui: ConfigPartDefinition<TGui>, name: string) {
		super(gui);
		this.gui.HeadingLabel.Text = name;
	}

	protected sameOrUndefined<T>(configs: Readonly<Record<BlockUuid, T>>) {
		let value: T | undefined;
		for (const [_, config] of Objects.pairs_(configs)) {
			if (value !== undefined && value !== config) {
				value = undefined;
				break;
			}

			value = config;
		}

		return value;
	}
	protected map<T, TOut extends defined>(
		configs: Readonly<Record<BlockUuid, T>>,
		mapfunc: (value: T, key: BlockUuid) => TOut,
	): Readonly<Record<BlockUuid, TOut>> {
		return Objects.fromEntries(Objects.entriesArray(configs).map((e) => [e[0], mapfunc(e[1], e[0])] as const));
	}
}
