import { RunService } from "@rbxts/services";
import { Logger } from "shared/Logger";

const logger = new Logger("CustomDebrisService");

let active = true;
if (!RunService.IsClient() && game.PrivateServerOwnerId !== 0) {
	logger.warn("Private server detected, disabling");
	active = false;
}

const storage: Map<Instance, number> = new Map<Instance, number>();

if (active) {
	task.spawn(() => {
		while (true as boolean) {
			storage.forEach((value, key) => {
				if (os.clock() >= value) {
					key.Destroy();
				}

				if (!key) {
					storage.delete(key);
				}
			});

			task.wait(1);
		}
	});
}

export namespace CustomDebrisService {
	export function set(instance: Instance, time: number) {
		if (!active) return;

		storage.set(instance, os.clock() + time);
	}

	export function exists(instance: Instance) {
		return get(instance) !== undefined;
	}

	export function get(instance: Instance) {
		return storage.get(instance);
	}

	export function remove(instance: Instance) {
		storage.delete(instance);
	}
}
