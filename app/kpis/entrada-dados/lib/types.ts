export type WeeklyStrings = {
	reach: string[];
	frequency: string[];
	views: string[];
	followers: string[];
	sch: string[];
	att: string[];
	clo: string[];
	salesTot: string[];
};

export type RecepWeekRow = { id: string; name: string; weeks: string[] };

export type FunnelStepStr = { value: string };

export type FunnelState = {
	scheduled: FunnelStepStr;
	present: FunnelStepStr;
	closings: FunnelStepStr;
};

export type RecepMonthRow = {
	id: string;
	name: string;
	leads: string;
	sales: string;
	goal: string;
	badge: string;
};

export type SalesComposition = {
	expV: string;
	expS: string;
	othV: string;
	othS: string;
};
