import { ContextActionService, Players } from "@rbxts/services";
import { InputController } from "client/controller/InputController";
import { Signals } from "client/event/Signals";
import { ObservableValue } from "shared/event/ObservableValue";
import { HostedService } from "shared/GameHost";
import { PartUtils } from "shared/utils/PartUtils";
import type { PlayerModule } from "client/types/PlayerModule";

export namespace LocalPlayerController {
	export const mouse = Players.LocalPlayer.GetMouse();
	export let humanoid: Humanoid | undefined;
	export let rootPart: BasePart | undefined;

	Players.LocalPlayer.CharacterAdded.Connect((_) => {
		// Wait for character loading if needed
		if (!Players.LocalPlayer.HasAppearanceLoaded()) Players.LocalPlayer.CharacterAppearanceLoaded.Wait();

		playerSpawned();
	});
	if (Players.LocalPlayer.Character) {
		playerSpawned();
	}
	Players.LocalPlayer.CameraMaxZoomDistance = 512;

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

	export function initializeSprintLogic(host: GameHostBuilder, sprintSpeed: number) {
		class SprintLogic extends HostedService {
			constructor() {
				super();

				const isSprinting = new ObservableValue<boolean>(false);

				// Update character walkspeed
				isSprinting.subscribe((value) => {
					if (!humanoid) return;

					const walkSpeed = 20;
					humanoid.WalkSpeed = value ? sprintSpeed : walkSpeed;
				});

				this.event.subscribeObservable(
					InputController.inputType,
					(inputType) => {
						// Remove old action (if exists)
						ContextActionService.UnbindAction("Sprint");

						// Bind new action
						ContextActionService.BindAction(
							"Sprint",
							(name, inputState) => {
								isSprinting.set(inputState === Enum.UserInputState.Begin);
								return Enum.ContextActionResult.Pass;
							},
							inputType === "Touch",
							Enum.KeyCode.LeftShift,
							Enum.KeyCode.ButtonY,
						);
						ContextActionService.SetImage("Sprint", "rbxassetid://9555118706");
						ContextActionService.SetDescription("Sprint", "Allows you to move more quickly");
						ContextActionService.SetPosition("Sprint", new UDim2(0, 20, 0, 50));
						ContextActionService.SetTitle("Sprint", "Sprint");
					},
					true,
				);
			}
		}

		host.services.registerService(SprintLogic);
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

	export function initialize() {}
}
