import { configControlRegistry } from "client/gui/config/ConfigControlRegistry";
import { ConfigValueControl } from "client/gui/config/ConfigValueControl";
import { configValueTemplateStorage } from "client/gui/config/ConfigValueTemplateStorage";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { BlockManager } from "shared/building/BlockManager";
import { ArgsSignal, Signal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";
import type { ConfigPartDefinition } from "client/gui/popup/SettingsPopup";

type MultiConfigControlDefinition = GuiObject;
type ConfigUpdatedCallback<TDef extends BlockConfigTypes.Definitions, TKey extends keyof TDef & string> = (
	key: TKey,
	values: Readonly<Record<BlockUuid, TDef[TKey]["config"]>>,
) => void;

export class MultiConfigControl<
	TDef extends BlockConfigTypes.Definitions,
> extends Control<MultiConfigControlDefinition> {
	private readonly _travelToConnectedPressed = new ArgsSignal<[uuid: BlockUuid]>();
	readonly travelToConnectedPressed = this._travelToConnectedPressed.asReadonly();
	readonly configUpdated = new Signal<ConfigUpdatedCallback<TDef, keyof TDef & string>>();

	constructor(
		gui: MultiConfigControlDefinition,
		configs: Readonly<Record<BlockUuid, ConfigDefinitionsToConfig<keyof TDef, TDef>>>,
		definition: Partial<TDef>,
		connected: readonly (keyof TDef)[] = [],
		block?: BlockModel,
	) {
		super(gui);

		for (const [id, def] of pairs(definition)) {
			if (def.configHidden) continue;
			if (connected.includes(id)) {
				const connectedControl = this.add(
					new ConnectedValueControl(configValueTemplateStorage.connected(), def.displayName),
				);

				if (block) {
					connectedControl.travelToConnectedPressed.Connect(() =>
						this._travelToConnectedPressed.Fire(
							BlockManager.manager.connections.get(block!)?.[id as BlockConnectionName].blockUuid,
						),
					);
				} else {
					connectedControl.disableButton();
				}

				continue;
			}

			const control = new configControlRegistry[def.type]({
				configs: Objects.fromEntries(
					Objects.entriesArray(configs).map((e) => [e[0], e[1][id]] as const),
				) as never,
				definition: def as never,
			});
			this.add(control);

			control.submitted.Connect((values) =>
				this.configUpdated.Fire(
					id as string,
					values as Readonly<Record<BlockUuid, TDef[keyof TDef]["config"]>>,
				),
			);
		}
	}
}

type ConnectedValueControlDefinition = GuiButton;
class ConnectedValueControl extends ConfigValueControl<ConnectedValueControlDefinition, UnknownConfigType> {
	private readonly _travelToConnectedPressed = new Signal();
	readonly travelToConnectedPressed = this._travelToConnectedPressed.asReadonly();

	private readonly button;

	constructor(gui: ConfigPartDefinition<ConnectedValueControlDefinition>, name: string) {
		super(gui, name);

		this.button = this.add(new ButtonControl(gui.Control));
		this.button.activated.Connect(() => this._travelToConnectedPressed.Fire());
	}

	disableButton() {
		//this.button.instance.BackgroundColor3 = Colors.accentDark;
		this.button.setInteractable(false);
	}
}
