import { PhysicsService } from "@rbxts/services";
import { HostedService } from "shared/GameHost";
import { PlayerWatcher } from "shared/PlayerWatcher";

export class PlayersCollision extends HostedService {
	constructor() {
		super();

		PhysicsService.RegisterCollisionGroup("PlayerCharacters");
		PhysicsService.CollisionGroupSetCollidable("PlayerCharacters", "PlayerCharacters", false);

		this.event.subscribeRegistration(() =>
			PlayerWatcher.onCharacterAdded((character, player) => {
				if (!player.HasAppearanceLoaded()) player.CharacterAppearanceLoaded.Wait();

				for (const child of character.GetDescendants()) {
					if (!child.IsA("BasePart")) return;

					child.CollisionGroup = "PlayerCharacters";
				}
			}),
		);
	}
}
