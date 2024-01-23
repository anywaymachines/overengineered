import { Workspace } from "@rbxts/services";
import SpreadingFireController from "server/SpreadingFireController";
import ServerEffects from "server/effects/ServerEffects";
import ServerPartUtils from "server/plots/ServerPartUtils";
import { UnreliableRemotes } from "shared/Remotes";
import BlockManager from "shared/building/BlockManager";

export default class UnreliableRemoteHandler {
	static init() {
		UnreliableRemotes.ReplicateSound.OnServerEvent.Connect((player, sound, isPlaying, volume) =>
			this.replicateSoundEvent(player, sound, isPlaying, volume),
		);

		UnreliableRemotes.ReplicateParticle.OnServerEvent.Connect((player, particle, isEnabled, acceleration) =>
			this.replicateParticleEvent(player, particle, isEnabled, acceleration),
		);

		UnreliableRemotes.ImpactBreak.OnServerEvent.Connect((player, part) => this.impactBreakEvent(player, part));
		UnreliableRemotes.ImpactExplode.OnServerEvent.Connect((player, part, blastRadius) =>
			this.impactExplodeEvent(player, part, blastRadius),
		);
		UnreliableRemotes.Burn.OnServerEvent.Connect((player, part) => this.burnEvent(player, part));
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

	static impactExplodeEvent(player: Player, block: BasePart, blastRadius: number) {
		if (!block || !block.Parent) {
			return;
		}

		if (!block.IsDescendantOf(Workspace)) {
			return;
		}

		if (block.Anchored || block.AssemblyRootPart?.Anchored) {
			return;
		}

		if (block.GetAttribute("broken") === true) {
			return;
		}

		if (block.GetNetworkOwner() !== player) {
			return;
		}

		const explosion = new Instance("Explosion");
		explosion.BlastPressure = 2000;
		explosion.BlastRadius = blastRadius;
		explosion.ExplosionType = Enum.ExplosionType.NoCraters;
		explosion.Visible = false;
		explosion.Position = block.Position;
		explosion.DestroyJointRadiusPercent = 0;
		explosion.Parent = block;
		explosion.Hit.Connect((part) => {
			if (math.random(1, 3) > 1) {
				this.impactBreakEvent(player, part);
			}
		});
	}

	static impactBreakEvent(player: Player, block: BasePart) {
		if (!block || !block.Parent) {
			return;
		}

		if (!BlockManager.isBlockPart(block)) {
			return;
		}

		if (block.Anchored || block.AssemblyRootPart?.Anchored) {
			return;
		}

		if (block.GetAttribute("broken") === true) {
			return;
		}

		if (block.GetNetworkOwner() !== player) {
			return;
		}

		ServerPartUtils.BreakJoints(block);
		block.SetAttribute("broken", true);

		// Play sounds
		ServerEffects.ImpactSound.create(block, player, { index: undefined });
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
}
