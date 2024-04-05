import { TweenService } from "@rbxts/services";

export class MusicPlaylist {
	readonly sounds: Sound[];
	private readonly interval: number;

	currentSound: Sound | undefined;
	private currentSoundEndEvent: RBXScriptConnection | undefined;

	constructor(sounds: Sound[], interval: number) {
		this.sounds = sounds;
		this.interval = interval;
	}

	play() {
		this.currentSound = this.sounds[math.random(0, this.sounds.size() - 1)];
		this.currentSoundEndEvent = this.currentSound.Ended.Once(() => {
			wait(this.interval);
			this.play();
		});
		this.currentSound.Play();
	}

	stop() {
		this.currentSoundEndEvent?.Disconnect();

		const tweenInfo = new TweenInfo(1);
		const tweenGoal = { Volume: 0 };
		const tween = TweenService.Create(this.currentSound!, tweenInfo, tweenGoal);

		tween.Play();
		tween.Completed.Wait();

		this.currentSound?.Stop();
		this.currentSound = undefined;
	}
}
