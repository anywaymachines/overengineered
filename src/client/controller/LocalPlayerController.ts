import { ContextActionService, Players, RunService } from "@rbxts/services";
import { InputController } from "client/controller/InputController";
import { Signals } from "client/event/Signals";
import { ObservableValue } from "shared/event/ObservableValue";
import { PartUtils } from "shared/utils/PartUtils";
import type { PlayerModule } from "client/types/PlayerModule";

export namespace LocalPlayerController {
	export const mouse = Players.LocalPlayer.GetMouse();
	export let humanoid: Humanoid | undefined;
	export let rootPart: BasePart | undefined;

	// Player settings
	const WALKSPEED_DEFAULT = 20;
	const WALKSPEED_SPRINT = RunService.IsStudio() ? 200 : 60;

	// Properties
	export const isSprinting = new ObservableValue<boolean>(false);

	function playerSpawned() {
		const character = Players.LocalPlayer.Character!;
		humanoid = character.WaitForChild("Humanoid") as Humanoid;
		rootPart = character.WaitForChild("HumanoidRootPart") as Part;

		// Death signal event
		humanoid.Died.Once(() => Signals.PLAYER.DIED.Fire());

		// Spawn signal
		Signals.PLAYER.SPAWN.Fire();

		// Prepare physics
		disableCharacterFluidForces();
	}

	function initializeSprintLogic() {
		// ContextActionService worker
		const runEvent = (_: string, inputState: Enum.UserInputState, inputObject: InputObject) => {
			if (inputState !== Enum.UserInputState.Begin) {
				isSprinting.set(false);
				return Enum.ContextActionResult.Pass;
			}
			isSprinting.set(true);
			return Enum.ContextActionResult.Pass;
		};

		// Update character walkspeed
		isSprinting.subscribe((value) => {
			if (!humanoid) return;

			humanoid.WalkSpeed = value ? WALKSPEED_SPRINT : WALKSPEED_DEFAULT;
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
			ContextActionService.SetPosition("Sprint", new UDim2(0, 20, 0, 50));
			ContextActionService.SetTitle("Sprint", "Sprint");
		}, true);
	}

	/** By default, character has `EnableFluidForces`, but because of the huge `Workspace.AirDensity`, it just flies like a feather */
	function disableCharacterFluidForces() {
		PartUtils.applyToAllDescendantsOfType("BasePart", Players.LocalPlayer.Character!, (part) => {
			part.EnableFluidForces = false;
		});
	}

	/** Native `PlayerModule` library */
	export function getPlayerModule(): PlayerModule {
		const instance = Players.LocalPlayer.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript;
		return require(instance) as PlayerModule;
	}

	export function initialize() {
		initializeSprintLogic();

		Players.LocalPlayer.CharacterAdded.Connect((_) => {
			// Wait for character loading if needed
			if (!Players.LocalPlayer.HasAppearanceLoaded()) Players.LocalPlayer.CharacterAppearanceLoaded.Wait();

			playerSpawned();
		});

		playerSpawned();

		Players.LocalPlayer.CameraMaxZoomDistance = 512;
	}
}
