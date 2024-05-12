import { InferDefinition } from "@rbxts/net/out/definitions/NamespaceBuilder";
import {
	AsyncServerFunctionDeclaration,
	BidirectionalEventDeclaration,
	ClientToServerEventDeclaration,
	DeclarationsOf,
	DefinitionsCreateResult,
	FilterGroups,
	FilterServerDeclarations,
	InferServerCallback,
	InferServerConnect,
	RemoteDeclarations,
} from "@rbxts/net/out/definitions/Types";
import { Remotes } from "shared/Remotes";

// Types copied from rbxts
type ServerEventDeclarationKeys<T extends RemoteDeclarations> = keyof DeclarationsOf<
	FilterServerDeclarations<T>,
	ClientToServerEventDeclaration<unknown[]> | BidirectionalEventDeclaration<unknown[], unknown[]>
> &
	string;
type ServerEventConnectFunction<T extends RemoteDeclarations, K extends keyof T> = InferServerConnect<
	Extract<T[K], ClientToServerEventDeclaration<unknown[]> | BidirectionalEventDeclaration<unknown[], unknown[]>>
>;
type ServerFunctionDeclarationKeys<T extends RemoteDeclarations> = keyof DeclarationsOf<
	FilterServerDeclarations<T>,
	AsyncServerFunctionDeclaration<unknown[], unknown>
> &
	string;
type ServerFunctionCallbackFunction<T extends RemoteDeclarations, K extends keyof T> = InferServerCallback<
	Extract<T[K], AsyncServerFunctionDeclaration<unknown[], unknown>>
>;

// Aliases
type Remotes = typeof Remotes extends DefinitionsCreateResult<infer T extends RemoteDeclarations> ? T : never;
type RemoteNamespace = keyof FilterGroups<Remotes> & string;
type RemoteNamespaceDefinition<TNamespace extends RemoteNamespace> = InferDefinition<Remotes[TNamespace]>;

type RemoteNamespace2<TNamespace extends RemoteNamespace> = keyof FilterGroups<RemoteNamespaceDefinition<TNamespace>> &
	string;
type RemoteNamespaceDefinition2<
	TNamespace extends RemoteNamespace,
	TNamespace2 extends RemoteNamespace2<TNamespace>,
> = InferDefinition<InferDefinition<Remotes[TNamespace]>[TNamespace2]>;

const wrapError = <TFunc extends (player: Player, ...args: unknown[]) => unknown>(func: TFunc): TFunc => {
	return ((player: Player, ...args: Parameters<TFunc>) => {
		try {
			return func(player, ...args) as ReturnType<TFunc>;
		} catch (error) {
			return { success: false, message: error as string } as ErrorResponse as ReturnType<TFunc>;
		}
	}) as TFunc;
};

// Functions
export const registerOnRemoteFunction = <
	TNamespace extends RemoteNamespace,
	TFunction extends ServerFunctionDeclarationKeys<RemoteNamespaceDefinition<TNamespace>> & string,
	TFunc extends ServerFunctionCallbackFunction<RemoteNamespaceDefinition<TNamespace>, TFunction>,
>(
	namespace: TNamespace,
	funcname: TFunction,
	func: TFunc,
) => {
	$log(`Registering ${namespace}.${funcname} function remote handler`);
	Remotes.Server.GetNamespace(namespace).OnFunction(funcname, wrapError(func));
};

export const registerOnRemoteEvent = <
	TNamespace extends RemoteNamespace,
	TFunction extends ServerEventDeclarationKeys<RemoteNamespaceDefinition<TNamespace>> & string,
	TFunc extends ServerEventConnectFunction<RemoteNamespaceDefinition<TNamespace>, TFunction>,
>(
	namespace: TNamespace,
	funcname: TFunction,
	func: TFunc,
) => {
	$log(`Registering ${namespace}.${funcname} event remote handler`);
	Remotes.Server.GetNamespace(namespace).OnEvent(funcname, wrapError(func));
};

export const registerOnRemoteFunction2 = <
	TNamespace extends RemoteNamespace,
	TNamespace2 extends RemoteNamespace2<TNamespace>,
	TFunction extends ServerFunctionDeclarationKeys<RemoteNamespaceDefinition2<TNamespace, TNamespace2>> & string,
	TFunc extends ServerFunctionCallbackFunction<RemoteNamespaceDefinition2<TNamespace, TNamespace2>, TFunction>,
>(
	namespace: TNamespace,
	namespace2: TNamespace2,
	funcname: TFunction,
	func: TFunc,
) => {
	$log(`Registering ${namespace}.${funcname} function remote handler`);
	Remotes.Server.GetNamespace(namespace).GetNamespace(namespace2).OnFunction(funcname, wrapError(func));
};

export const registerOnRemoteEvent2 = <
	TNamespace extends RemoteNamespace,
	TNamespace2 extends RemoteNamespace2<TNamespace>,
	TFunction extends ServerEventDeclarationKeys<RemoteNamespaceDefinition2<TNamespace, TNamespace2>> & string,
	TFunc extends ServerEventConnectFunction<RemoteNamespaceDefinition2<TNamespace, TNamespace2>, TFunction>,
>(
	namespace: TNamespace,
	namespace2: TNamespace2,
	funcname: TFunction,
	func: TFunc,
) => {
	$log(`Registering ${namespace}.${funcname} event remote handler`);
	Remotes.Server.GetNamespace(namespace).GetNamespace(namespace2).OnEvent(funcname, wrapError(func));
};
