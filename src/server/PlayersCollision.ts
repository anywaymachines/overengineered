import { PhysicsService, Players } from "@rbxts/services";
import { HostedService } from "shared/GameHost";

export class PlayersCollision extends HostedService {
	constructor() {
		super();

		PhysicsService.RegisterCollisionGroup("PlayerCharacters");
		PhysicsService.CollisionGroupSetCollidable("PlayerCharacters", "PlayerCharacters", false);

		Players.PlayerAdded.Connect((plr) => {
			plr.CharacterAdded.Connect((character) => {
				for (const child of character.GetChildren()) {
					if (!child.IsA("BasePart")) return;

					child.CollisionGroup = "PlayerCharacters";
				}
			});
		});
	}
}
