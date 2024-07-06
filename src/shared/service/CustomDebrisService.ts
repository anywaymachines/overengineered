import { RunService } from "@rbxts/services";

let active = true;
if (!RunService.IsClient() && game.PrivateServerOwnerId !== 0) {
	$warn("Private server detected, disabling");
	active = false;
}

const storage: Map<Instance, number> = new Map<Instance, number>();

if (active) {
	task.spawn(() => {
		const toBeDeleted: Instance[] = [];

		while (true as boolean) {
			const time = os.clock();

			for (const [instance, deltime] of storage) {
				if (time < deltime) continue;

				instance.Destroy();
				toBeDeleted.push(instance);
			}

			for (const instance of toBeDeleted) {
				storage.delete(instance);
			}
			toBeDeleted.clear();

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
