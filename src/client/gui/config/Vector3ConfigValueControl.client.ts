import Signal from "@rbxts/signal";
import Control from "client/gui/Control";
import { ConfigControlDefinition } from "client/gui/buildmode/ConfigControl";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

type Vector3ConfigValueControlDefinition = ConfigControlDefinition;
class Vector3ConfigValueControl extends ConfigValueControl<Vector3ConfigValueControlDefinition> {
	readonly submitted = new Signal<(config: Readonly<Record<BlockUuid, BlockConfigTypes.Vec3["config"]>>) => void>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.Vec3["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.Vec3>,
	) {
		super(configValueTemplateStorage.multi(), definition.displayName);

		const defs = {
			X: {
				displayName: "X",
				type: "number",
				default: 0,
				config: 0,
			},
			Y: {
				displayName: "Y",
				type: "number",
				default: 0,
				config: 0,
			},
			Z: {
				displayName: "Z",
				type: "number",
				default: 0,
				config: 0,
			},
		} satisfies Record<string, ConfigTypeToDefinition<BlockConfigTypes.Number>>;

		const withval = (vec: Vector3, value: number, key: keyof typeof defs) => {
			if (key === "X") return new Vector3(value, vec.Y, vec.Z);
			if (key === "Y") return new Vector3(vec.X, value, vec.Z);
			if (key === "Z") return new Vector3(vec.X, vec.Y, value);

			throw "Invalid key";
		};

		const list = this.add(new Control(this.gui.Control));
		const create = (key: keyof typeof defs) => {
			const control = new configControlRegistry.number(
				this.map(configs, (e) => e[key]),
				defs[key],
			);
			list.add(control);

			this.event.subscribe(control.submitted, (value) =>
				this.submitted.Fire((configs = this.map(configs, (e, k) => withval(e, value[k], key)))),
			);

			return control;
		};

		const x = create("X");
		const y = create("Y");
		const z = create("Z");
	}
}

configControlRegistry.set("vector3", Vector3ConfigValueControl);
