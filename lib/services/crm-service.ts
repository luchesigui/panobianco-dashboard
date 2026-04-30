import DayjsUtils from "@date-io/dayjs";

const dateFns = new DayjsUtils();

const EVO_API_URL =
	process.env.EVO_API_URL ?? "https://evo-integracao-api.w12app.com.br/api/v1/";
const EVO_USERNAME = "panobiancos";

export enum AccountStatus {
	Open = 1,
	Received = 2,
	Canceled = 3,
	Overdue = 4,
}

export interface RevenueCenterItem {
	idRevenueCenter: number;
	description: string;
	active: boolean;
}

export interface ReceivableItem {
	idReceivable: number;
	ammount: number;
	ammountPaid: number;
	status: { id: AccountStatus; name: string };
	idRevenueCenter: number;
	cancellationDate: string | null;
}

export class CRMService {
	private readonly authHeader: string;

	constructor(token: string) {
		const credentials = Buffer.from(`${EVO_USERNAME}:${token}`).toString(
			"base64",
		);
		this.authHeader = `Basic ${credentials}`;
	}

	async getRevenueCenter(): Promise<RevenueCenterItem[]> {
		const res = await fetch(`${EVO_API_URL}revenuecenter`, {
			headers: { Authorization: this.authHeader },
		});

		if (!res.ok) {
			throw new Error(
				`EVO getRevenueCenter falhou: ${res.status} ${res.statusText}`,
			);
		}

		return res.json() as Promise<RevenueCenterItem[]>;
	}

	async getReceivablesPage(params: {
		dueDateStart: string;
		dueDateEnd: string;
		skip: number;
		take?: number;
	}): Promise<ReceivableItem[]> {
		const take = params.take ?? 50;
		const url = new URL(`${EVO_API_URL}receivables`);
		url.searchParams.set("dueDateStart", params.dueDateStart);
		url.searchParams.set("dueDateEnd", params.dueDateEnd);
		url.searchParams.set("skip", String(params.skip));
		url.searchParams.set("take", String(take));

		const res = await fetch(url.toString(), {
			headers: { Authorization: this.authHeader },
		});

		if (res.status === 429) {
			throw new Error(`429: EVO API rate limit atingido`);
		}
		if (!res.ok) {
			throw new Error(
				`EVO getReceivables falhou: ${res.status} ${res.statusText}`,
			);
		}

		return res.json() as Promise<ReceivableItem[]>;
	}

	async getReceivables(params?: {
		dueDateStart?: string;
		dueDateEnd?: string;
	}): Promise<ReceivableItem[]> {
		const today = dateFns.date();
		const dueDateStart =
			params?.dueDateStart ?? today.startOf("month").format("YYYY-MM-DD");
		const dueDateEnd =
			params?.dueDateEnd ?? today.endOf("month").format("YYYY-MM-DD");

		const PAGE_SIZE = 50;
		const all: ReceivableItem[] = [];
		let skip = 0;

		while (true) {
			const page = await this.getReceivablesPage({
				dueDateStart,
				dueDateEnd,
				skip,
				take: PAGE_SIZE,
			});
			all.push(...page);
			if (page.length < PAGE_SIZE) break;
			skip += PAGE_SIZE;
		}

		return all;
	}
}
