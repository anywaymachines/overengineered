import { _UnreliableRemoteEvent } from "shared/Remotes";

export default abstract class ClientEffectBase<T> {
	protected readonly remote: _UnreliableRemoteEvent<(part: BasePart, args: T) => void>;

	constructor(createRemote: _UnreliableRemoteEvent<(part: BasePart, args: T) => void>) {
		this.remote = createRemote;

		this.listenServer();
	}

	protected listenServer() {
		this.remote.OnClientEvent.Connect((part, arg) => this.create(part, false, arg));
	}

	/** Creating an effect on the client side and sending it to the server so that other clients can see the effect */
	public create(part: BasePart, share: boolean, arg: T): void {
		// Share effect with others
		if (share) {
			this.remote.FireServer(part, arg);
		}
	}
}
