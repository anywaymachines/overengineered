import { SharedBuilding } from "shared/building/SharedBuilding";
import SharedPlots from "shared/building/SharedPlots";
import JSON, { JsonSerializablePrimitive } from "shared/fixes/Json";
import Objects from "shared/fixes/objects";

const errorPlotNotFound = (): ErrorResponse => {
	return {
		success: false,
		message: "Plot not found",
	};
};
const errorBuildingNotPermitted = (): ErrorResponse => {
	return {
		success: false,
		message: "Building is not permitted",
	};
};

export default class BuildingWrapper {
	static tryGetValidPlotByBlock(
		this: void,
		player: Player,
		block: BlockModel,
	): (SuccessResponse & { plot: PlotModel }) | ErrorResponse {
		const plot = SharedPlots.getPlotByBlock(block);

		// No plot?
		if (plot === undefined) {
			return errorPlotNotFound();
		}

		// Plot is forbidden
		if (!SharedPlots.isBuildingAllowed(plot, player)) {
			return errorBuildingNotPermitted();
		}

		return {
			success: true,
			plot,
		};
	}

	static updateConfigAsPlayer(this: void, player: Player, data: ConfigUpdateRequest): Response {
		for (const config of data.configs) {
			const plot = BuildingWrapper.tryGetValidPlotByBlock(player, config.block);
			if (!plot.success) return plot;
		}

		return BuildingWrapper.updateConfig(data);
	}
	static updateConfig(this: void, data: ConfigUpdateRequest): Response {
		/**
		 * Assign only values, recursively.
		 * @example assignValues({ a: { b: 'foo' } }, 'a', { c: 'bar' })
		 * // returns:
		 * { a: { b: 'foo', c: 'bar' } }
		 */
		const withValues = <T extends Record<string, JsonSerializablePrimitive | object>>(
			object: T,
			value: Partial<T>,
		): object => {
			const setobj = <T extends Record<string, JsonSerializablePrimitive | object>, TKey extends keyof T>(
				object: T,
				key: TKey,
				value: T[TKey],
			) => {
				if (!typeIs(value, "table")) {
					return { ...object, [key]: value };
				}

				return withValues(object, value);
			};

			const ret: Record<string, JsonSerializablePrimitive | object> = { ...object };
			for (const [key, val] of Objects.pairs(value as Record<string, JsonSerializablePrimitive | object>)) {
				const rk = ret[key];

				if (typeIs(rk, "Vector3") || !typeIs(rk, "table")) {
					ret[key] = val;
				} else {
					ret[key] = setobj(rk as Record<string, JsonSerializablePrimitive | object>, key, val);
				}
			}

			return ret;
		};

		for (const config of data.configs) {
			const dataTag = config.block.GetAttribute("config") as string | undefined;
			const currentData = JSON.deserialize(dataTag ?? "{}") as Record<string, JsonSerializablePrimitive>;

			const newData = withValues(currentData, { [config.key]: JSON.deserialize(config.value) });
			config.block.SetAttribute("config", JSON.serialize(newData as JsonSerializablePrimitive));
		}

		return { success: true };
	}

	static paintAsPlayer(this: void, player: Player, data: PaintRequest): Response {
		if ("blocks" in data) {
			for (const block of data.blocks) {
				const plot = BuildingWrapper.tryGetValidPlotByBlock(player, block);
				if (!plot.success) return plot;
			}
		} else {
			if (!SharedPlots.isBuildingAllowed(data.plot, player)) {
				return errorBuildingNotPermitted();
			}
		}

		return SharedBuilding.paint(data);
	}
}
