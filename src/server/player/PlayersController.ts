import { Players } from "@rbxts/services";
import { PlayerController } from "server/player/PlayerController";
import { Component } from "shared/component/Component";
import { ComponentKeyedChildren } from "shared/component/ComponentKeyedChildren";

const component = new Component();
component.enable();

const children = new ComponentKeyedChildren<Player, PlayerController>(component);
Players.PlayerAdded.Connect((player) => children.add(player, new PlayerController(player)));

export namespace PlayersController {
	export const errDestroyed: ErrorResponse = { success: false, message: "PLAYER DESTROYED" };

	/** Empty function to trigger the initialization */
	export function initialize() {}

	export function onJoin(func: (player: Player) => void) {
		return Players.PlayerAdded.Connect(func);
	}
	export function onQuit(func: (player: Player) => void) {
		return Players.PlayerRemoving.Connect(func);
	}

	export function createContainer<T extends IDestroyableComponent & IReadonlyDestroyableComponent>(
		ctor: (player: Player) => T | undefined,
	): Map<Player, T> {
		const container = new Map<Player, T>();
		onJoin((player) => {
			const component = ctor(player);
			if (!component) return;

			container.set(player, component);
			component.onDestroy(() => container.delete(player));
		});

		return container;
	}

	export function tryGet(player: Player) {
		return children.get(player);
	}
}
