import { ReplicatedStorage } from "@rbxts/services";
import { UnreliableRemotes } from "shared/Remotes";
import ClientEffectBase from "./EffectBase";

export default class ClientImpactSoundEffect extends ClientEffectBase<ImpactSoundEffectArgs> {
	private readonly materialSounds: { [key: string]: Instance[] } = {
		Default: ReplicatedStorage.Assets.Sounds.Impact.Materials.Metal.GetChildren(),

		Metal: ReplicatedStorage.Assets.Sounds.Impact.Materials.Metal.GetChildren(),
		Wood: ReplicatedStorage.Assets.Sounds.Impact.Materials.Wood.GetChildren(),
	};

	constructor() {
		super(UnreliableRemotes.ImpactSoundEffect);
	}

	public create(part: BasePart, share: boolean, { index }: ImpactSoundEffectArgs): void {
		//super.create(part, share);

		if (!part || !part.Parent) {
			return;
		}

		const soundsFolder = this.materialSounds[part.Material.Name] ?? this.materialSounds["Default"];
		const soundIndex = index ?? math.random(0, soundsFolder.size() - 1);
		const sound = soundsFolder[soundIndex].Clone() as Sound;

		if (share) {
			this.remote.FireServer(part, { index: soundIndex });
		}

		sound.RollOffMaxDistance = 1000;
		sound.Volume = 0.5;
		sound.Parent = part;
		sound.Play();

		game.GetService("Debris").AddItem(sound, sound.TimeLength);
	}
}
