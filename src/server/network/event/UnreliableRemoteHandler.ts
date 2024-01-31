import SpreadingFireController from "server/SpreadingFireController";
import ServerPartUtils from "server/plots/ServerPartUtils";
import { UnreliableRemotes } from "shared/Remotes";
import BlockManager from "shared/building/BlockManager";
import Effects from "shared/effects/Effects";

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
		if (!sound || !sound.Parent) return;

		const part = sound.Parent as BasePart;
		if (!BlockManager.isActiveBlockPart(part)) return;
		if (part.GetNetworkOwner() !== player) return;

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
		if (!particle || !particle.Parent) return;

		const part = particle.Parent as BasePart;
		if (!BlockManager.isActiveBlockPart(part)) return;
		if (part.GetNetworkOwner() !== player) return;

		particle.Enabled = isEnabled;
		particle.Acceleration = acceleration;
	}

	static impactExplodeEvent(player: Player, block: BasePart, blastRadius: number) {
		if (!BlockManager.isActiveBlockPart(block)) return;

		if (block.GetAttribute("IMPACT_BROKEN") === true) {
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
		if (!BlockManager.isActiveBlockPart(block)) return;

		if (block.GetAttribute("IMPACT_BROKEN") === true) return;

		ServerPartUtils.BreakJoints(block);
		block.SetAttribute("IMPACT_BROKEN", true);

		// Play sounds
		Effects.ImpactSound.send(block, { index: undefined }, player);
	}

	static burnEvent(player: Player, block: BasePart) {
		if (!BlockManager.isActiveBlockPart(block)) return;

		SpreadingFireController.burn(block);
	}
}
