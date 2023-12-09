import { UnreliableRemotes } from "shared/Remotes";

export default class ReplicateRemoteHandler {
	static init() {
		UnreliableRemotes.ReplicateSound.OnServerEvent.Connect((player, sound, isPlaying, volume) =>
			this.replicateSoundEvent(player, sound, isPlaying, volume),
		);

		UnreliableRemotes.ReplicateParticle.OnServerEvent.Connect((player, particle, isEnabled, acceleration) =>
			this.replicateParticleEvent(player, particle, isEnabled, acceleration),
		);
	}

	static replicateSoundEvent(player: Player, sound: Sound, isPlaying: boolean, volume: number) {
		if (!sound.Parent) {
			return;
		}

		if ((sound.Parent as Part).GetNetworkOwner() !== player) {
			player.Kick();
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
		if (!particle.Parent) {
			return;
		}

		if ((particle.Parent as Part).GetNetworkOwner() !== player) {
			player.Kick();
			return;
		}

		particle.Enabled = isEnabled;
		particle.Acceleration = acceleration;
	}
}
