const START_ROUTE_LABELS = {
  "/chat/all": "聊天",
  "/rooms": "讨论间",
  "/inbox": "收件箱",
  "/mailbox": "交接箱",
} as const;

export const START_ROUTE_OPTIONS = Object.keys(START_ROUTE_LABELS) as Array<keyof typeof START_ROUTE_LABELS>;

export type StartRoute = (typeof START_ROUTE_OPTIONS)[number];

function normalized(route?: string) {
  return route?.trim() ?? "";
}

export function isSupportedStartRoute(route?: string): route is StartRoute {
  const trimmed = normalized(route);
  return trimmed in START_ROUTE_LABELS;
}

export function supportedStartRouteLabel(route?: string) {
  if (!isSupportedStartRoute(route)) {
    return "";
  }
  return START_ROUTE_LABELS[normalized(route) as StartRoute];
}

export function startRouteLabel(route?: string) {
  return supportedStartRouteLabel(route) || normalized(route) || "未声明";
}

export function normalizeSupportedStartRoute(route?: string): StartRoute {
  if (isSupportedStartRoute(route)) {
    return normalized(route) as StartRoute;
  }
  return "/chat/all";
}
