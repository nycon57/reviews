import { cache } from "react";

import { getAvailableIndustries, searchProfessionals } from "@/lib/directory/actions";

export const cachedSearchProfessionals = cache(searchProfessionals);
export const cachedGetAvailableIndustries = cache(getAvailableIndustries);
