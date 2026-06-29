import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// auth.getUser() revalidates the session against Supabase's auth server over
// the network — it is not a free local cookie read. Several places on the
// same page (layout + page, or a page that also needs the phone number) used
// to each call it separately, multiplying that round trip per navigation.
// cache() dedupes repeat calls within a single request.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});
