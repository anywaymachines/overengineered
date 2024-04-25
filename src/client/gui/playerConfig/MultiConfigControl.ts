import { Control } from "client/gui/Control";
import { playerConfigControlRegistry } from "client/gui/playerConfig/PlayerConfigControlRegistry";
import { Signal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";

type ConfigControlDefinition = GuiObject;
export class MultiPlayerConfigControl<
	TDef extends PlayerConfigTypes.Definitions,
> extends Control<ConfigControlDefinition> {
	readonly configUpdated = new Signal<
		(key: keyof TDef, value: PlayerConfigTypes.Types[keyof PlayerConfigTypes.Types]["config"]) => void
	>();

	private settedElements = new Map<keyof TDef, Control>();

	constructor(gui: ConfigControlDefinition);
	constructor(gui: ConfigControlDefinition, config: ConfigDefinitionsToConfig<keyof TDef, TDef>, definition: TDef);
	constructor(gui: ConfigControlDefinition, config?: ConfigDefinitionsToConfig<keyof TDef, TDef>, definition?: TDef) {
		super(gui);

		if (config && definition) {
			this.set(config, definition);
		}
	}

	get(key: keyof TDef): Control {
		return this.settedElements.get(key)!;
	}
	set(config: ConfigDefinitionsToConfig<keyof TDef, TDef>, definition: TDef) {
		this.clear();
		this.settedElements.clear();

		for (const [id, def] of Objects.entriesArray(definition).sort(
			(left, right) => tostring(left[0]) < tostring(right[0]),
		)) {
			const control = new playerConfigControlRegistry[def.type](config[id] as never, def as never);
			this.add(control);
			this.settedElements.set(id, control);

			control.submitted.Connect((value) => this.configUpdated.Fire(id as string, value as never));
		}
	}
}
