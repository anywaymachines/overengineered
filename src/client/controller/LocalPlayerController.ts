import { Players } from "@rbxts/services";
import Signals from "client/event/Signals";
import { PlayerModule } from "client/types/PlayerModule";
import SharedPlots from "shared/building/SharedPlots";

export default class LocalPlayerController {
	static isRunning: boolean;
	static humanoid: Humanoid | undefined;

	static initialize() {
		Players.LocalPlayer.CharacterAdded.Connect((character) => {
			this.onPlayerAdded();
		});

		this.onPlayerAdded();
	}

	private static onPlayerAdded() {
		while (!Players.LocalPlayer.Character) {
			wait(0.1);
		}

		this.humanoid = Players.LocalPlayer.Character.WaitForChild("Humanoid") as Humanoid;

		Signals.PLAYER.SPAWN.Fire();

		this.humanoid.Died.Once(() => {
			Signals.PLAYER.DIED.Fire();
		});

		this.humanoid.Running.Connect((speed) => {
			this.isRunning = speed > (this.humanoid!.WalkSpeed as number) / 2;
		});

		const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
		const pos = plot.GetPivot().Position.add(new Vector3(plot.GetExtentsSize().X / 2 + 2, 10, 0));
		(Players.LocalPlayer.Character.FindFirstChild("HumanoidRootPart") as Part).CFrame = new CFrame(pos);
	}

	static getPlayerModuleInstance(): ModuleScript {
		return Players.LocalPlayer.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript;
	}

	static getPlayerModule(): PlayerModule {
		return require(this.getPlayerModuleInstance()) as PlayerModule;
	}
}
