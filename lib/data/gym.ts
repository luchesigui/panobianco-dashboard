import { cache } from "react";
import { getServiceSupabase } from "@/lib/supabase/server";

export const getGym = cache(async () => {
	const supabase = getServiceSupabase();
	const { data, error } = await supabase
		.from("gyms")
		.select("id,name,slug")
		.eq("slug", "panobianco-sjc-satelite")
		.single();

	if (error || !data) throw new Error(`Gym load failed: ${error?.message}`);
	return data;
});
