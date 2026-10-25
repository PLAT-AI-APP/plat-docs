import type { MetadataRoute } from "next";
import { ALLOW_INDEXING } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: ALLOW_INDEXING ? { userAgent: "*", allow: "/" } : { userAgent: "*", disallow: "/" },
  };
}
