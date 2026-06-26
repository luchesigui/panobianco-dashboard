export type WeeklyStrings = {
	reach: string[];
	frequency: string[];
	views: string[];
	followers: string[];
	scheduledWeekly: string[];
	attendanceWeekly: string[];
	closingsWeekly: string[];
	totalLeadsWeekly: string[];
	totalSalesWeekly: string[];
};

export type RecepWeekRow = {
	id: string;
	name: string;
	leads: string[];
	sales: string[];
};

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
	experimentalClassValue: string;
	experimentalClassSubtext: string;
	otherChannelsValue: string;
	otherChannelsSubtext: string;
};
