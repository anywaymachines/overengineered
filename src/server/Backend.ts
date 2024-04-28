import { HttpService } from "@rbxts/services";

type Datastore = {
	name: string;
	createdTime: string;
};

type ListDataStoresResponse = {
	datastores: Datastore[];
	nextPageCursor: string;
};

type ListEntriesResponse = {
	keys: { [key: string]: string };
	nextPageCursor: string;
};

export namespace Backend {
	const DIST = "https://api.mgcode.ru/roblox";

	function getRequest(endpoint: string) {
		const _data = {
			address: endpoint,
		};

		return HttpService.JSONDecode(
			HttpService.PostAsync(
				`${DIST}/open-cloud/get`,
				HttpService.JSONEncode(_data),
				Enum.HttpContentType.ApplicationJson,
			),
		);
	}

	function combineParametersForGetRequest(data: Record<string, unknown>): string {
		// in lua, a Map<T, K> is the same as Record<T, K> so we use a cast to Map to use more performant methods
		return (data as unknown as ReadonlyMap<string, defined>).map((k, v) => `${k}=${v}`).join("&");
	}

	/** https://create.roblox.com/docs/reference/cloud/datastores-api/ */
	export namespace Datastores {
		const endpoint = "https://apis.roblox.com/datastores";

		/**
		 * Returns a list of an experience's data stores.
		 * @arg universeID The identifier of the experience with data stores that you want to access. You can copy your experience's Universe ID on the Creator Dashboard.
		 * @arg cursor Provide to request the next set of data.
		 * @arg limit The maximum number of items to return. Each call only reads one partition, so it can return fewer than the given value when running out of objectives on one partition.
		 * @arg prefix Provide to return only data stores with this prefix.
		 */
		export function ListDataStores(
			universeId: number,
			cursor?: string,
			limit?: number,
			prefix?: string,
		): ListDataStoresResponse {
			const query = combineParametersForGetRequest({ cursor, limit, prefix });

			return getRequest(
				`${endpoint}/v1/universes/${universeId}/standard-datastores?${query}`,
			) as ListDataStoresResponse;
		}

		/**
		 * The following endpoints are available at paths relative to the base URL.
		 * @arg universeId The identifier of the experience with data stores that you want to access. You can copy your experience's Universe ID on the Creator Dashboard.
		 * @arg datastoreName The name of the data store.
		 * @arg scope The value is global by default.
		 * @arg allScopes Set to true to return keys from all scopes.
		 * @arg prefix Provide to return only keys with this prefix.
		 * @arg cursor Provide to request the next set of data.
		 * @arg limit The maximum number of items to return. Each call only reads one partition, so it can return fewer than the given value when running out of objectives on one partition.
		 */
		export function ListEntries(
			universeId: number,
			datastoreName?: string,
			scope?: string,
			allScopes?: boolean,
			prefix?: string,
			cursor?: string,
			limit?: number,
		): ListEntriesResponse {
			const query = combineParametersForGetRequest({ datastoreName, scope, allScopes, prefix, cursor, limit });

			return getRequest(
				`${endpoint}/v1/universes/${universeId}/standard-datastores/datastore/entries?${query}`,
			) as ListEntriesResponse;
		}

		/**
		 * Returns the value and metadata associated with an entry.
		 * @arg universeId The identifier of the experience with data stores that you want to access. You can copy your experience's Universe ID on the Creator Dashboard.
		 * @arg datastoreName The name of the data store.
		 * @arg entryKey The key identifying the entry.
		 * @arg scope The value is global by default.
		 */
		export function GetEntry(
			universeId: number,
			datastoreName?: string,
			entryKey?: string,
			scope?: string,
		): unknown {
			const query = combineParametersForGetRequest({ datastoreName, entryKey, scope });

			return getRequest(
				`${endpoint}/v1/universes/${universeId}/standard-datastores/datastore/entries/entry?${query}`,
			) as unknown;
		}
	}
}
