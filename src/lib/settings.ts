// The site's settings files (business details and notice; brand is fixed on this site, SITE-DIFFERENCES D11), checked at build. Server only.
import type { BusinessData } from "../settings/business.ts";
import type { NoticeData } from "../settings/notice.ts";
import { getSiteContent } from "./site-content.ts";

export const getBusiness = (): BusinessData => getSiteContent().business;
export const getNotice = (): NoticeData => getSiteContent().notice;
