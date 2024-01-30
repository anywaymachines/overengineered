import { ContextActionService, Players } from "@rbxts/services";
import Signals from "client/event/Signals";
import { PlayerModule } from "client/types/PlayerModule";
import ObservableValue from "shared/event/ObservableValue";
import PartUtils from "shared/utils/PartUtils";
import InputController from "./InputController";

export default class LocalPlayerController {
	static humanoid: Humanoid | undefined;
	static rootPart: BasePart | undefined;

	// Player settings
	private static readonly WALKSPEED_DEFAULT = 20;
	private static readonly WALKSPEED_SPRINT = 60;

	// Properties
	static readonly isSprinting = new ObservableValue<boolean>(false);

	private static playerSpawned() {
		const character = Players.LocalPlayer.Character!;
		this.humanoid = character.FindFirstChild("Humanoid") as Humanoid;
		this.rootPart = this.humanoid.RootPart;

		// Death signal event
		this.humanoid.Died.Once(() => Signals.PLAYER.DIED.Fire());

		// Spawn signal
		Signals.PLAYER.SPAWN.Fire();

		// Prepare physics
		this.disableCharacterFluidForces();
	}

	private static initializeSprintLogic() {
		// ContextActionService worker
		const runEvent = (_: string, inputState: Enum.UserInputState, inputObject: InputObject) => {
			if (inputState !== Enum.UserInputState.Begin) {
				this.isSprinting.set(false);
				return Enum.ContextActionResult.Pass;
			}
			this.isSprinting.set(true);
			return Enum.ContextActionResult.Pass;
		};

		// Update character walkspeed
		this.isSprinting.subscribe((value) => {
			if (!this.humanoid) return;

			this.humanoid.WalkSpeed = value ? this.WALKSPEED_SPRINT : this.WALKSPEED_DEFAULT;
		});

		// Input type handling for displaying sprint button correctly
		InputController.inputType.subscribe((inputType) => {
			// Remove old action (if exists)
			ContextActionService.UnbindAction("Sprint");

			// Bind new action
			ContextActionService.BindAction(
				"Sprint",
				runEvent,
				inputType === "Touch",
				Enum.KeyCode.LeftShift,
				Enum.KeyCode.ButtonY,
			);
			ContextActionService.SetImage("Sprint", "rbxassetid://9555118706");
			ContextActionService.SetDescription("Sprint", "Allows you to move more quickly");
		}, true);
	}

	/** By default, character has `EnableFluidForces`, but because of the huge `Workspace.AirDensity`, it just flies like a feather */
	private static disableCharacterFluidForces() {
		PartUtils.applyToAllDescendantsOfType("BasePart", Players.LocalPlayer.Character!, (part) => {
			part.EnableFluidForces = false;
		});
	}

	/** Native `PlayerModule` library */
	static getPlayerModule(): PlayerModule {
		const instance = Players.LocalPlayer.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript;
		return require(instance) as PlayerModule;
	}

	static initialize() {
		this.initializeSprintLogic();

		Players.LocalPlayer.CharacterAdded.Connect((_) => {
			// Wait for character loading if needed
			if (!Players.LocalPlayer.HasAppearanceLoaded()) Players.LocalPlayer.CharacterAppearanceLoaded.Wait();

			this.playerSpawned();
		});

		this.playerSpawned();
	}
}
