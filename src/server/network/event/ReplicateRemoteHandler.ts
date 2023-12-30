import { ReplicatedStorage, Workspace } from "@rbxts/services";
import SpreadingFireController from "server/SpreadingFireController";
import { UnreliableRemotes } from "shared/Remotes";

export default class ReplicateRemoteHandler {
	static init() {
		UnreliableRemotes.ReplicateSound.OnServerEvent.Connect((player, sound, isPlaying, volume) =>
			this.replicateSoundEvent(player, sound, isPlaying, volume),
		);

		UnreliableRemotes.ReplicateParticle.OnServerEvent.Connect((player, particle, isEnabled, acceleration) =>
			this.replicateParticleEvent(player, particle, isEnabled, acceleration),
		);

		UnreliableRemotes.BreakJoints.OnServerEvent.Connect((player, part) => this.breakJointsEvent(player, part));
		UnreliableRemotes.Burn.OnServerEvent.Connect((player, part) => this.burnEvent(player, part));
		UnreliableRemotes.CreateSparks.OnServerEvent.Connect((player, part) => this.createSparksEvent(player, part));
	}

	static replicateSoundEvent(player: Player, sound: Sound, isPlaying: boolean, volume: number) {
		if (!sound) {
			return;
		}

		if (!sound.Parent) {
			return;
		}

		if (!sound.Parent.IsDescendantOf(Workspace)) {
			return;
		}

		if ((sound.Parent as Part).GetNetworkOwner() !== player) {
			return;
		}

		if (volume > 1) {
			// Probably exploiting
			return;
		}

		sound.Playing = isPlaying;
		sound.Volume = volume;
	}

	static replicateParticleEvent(
		player: Player,
		particle: ParticleEmitter,
		isEnabled: boolean,
		acceleration: Vector3,
	) {
		if (!particle || !particle.Parent) {
			return;
		}

		if (!particle.Parent.IsDescendantOf(Workspace)) {
			return;
		}

		if ((particle.Parent as Part).GetNetworkOwner() !== player) {
			return;
		}

		particle.Enabled = isEnabled;
		particle.Acceleration = acceleration;
	}

	static breakJointsEvent(player: Player, block: BasePart) {
		if (!block || !block.Parent) {
			return;
		}

		if (!block.IsDescendantOf(Workspace)) {
			return;
		}

		if (block.GetNetworkOwner() !== player) {
			return;
		}

		block.BreakJoints();
		block.SetAttribute("broken", true);
	}

	static burnEvent(player: Player, block: BasePart) {
		if (!block || !block.Parent) {
			return;
		}

		if (!block.IsDescendantOf(Workspace)) {
			return;
		}

		if (block.GetNetworkOwner() !== player) {
			return;
		}

		SpreadingFireController.burn(block);
	}

	static createSparksEvent(player: Player, block: BasePart) {
		if (!block || !block.Parent) {
			return;
		}

		if (!block.IsDescendantOf(Workspace)) {
			return;
		}

		if (block.GetNetworkOwner() !== player) {
			return;
		}

		const sparks = ReplicatedStorage.Assets.Sparks.Clone();
		sparks.Parent = block;
		game.GetService("Debris").AddItem(sparks, 1.5);
	}
}
