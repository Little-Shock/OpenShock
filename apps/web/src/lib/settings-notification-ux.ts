import type { BrowserPermissionState, BrowserRegistrationState } from "./browser-notifications";
import type { NotificationSubscriberStatus } from "./live-notifications";

export function currentBrowserSubscriberStatus(surface: {
  permission: BrowserPermissionState;
  registrationState: BrowserRegistrationState;
}): NotificationSubscriberStatus {
  if (surface.permission === "denied" || surface.registrationState === "blocked" || surface.registrationState === "error") {
    return "blocked";
  }
  if (surface.permission === "granted" && surface.registrationState === "ready") {
    return "ready";
  }
  return "pending";
}

export function buildSettingsNotificationSummary({
  loading,
  error,
  subscriberCount,
  readyDeliveries,
  suppressedDeliveries,
}: {
  loading: boolean;
  error: string | null;
  subscriberCount: number;
  readyDeliveries: number;
  suppressedDeliveries: number;
}) {
  if (loading) {
    return "同步中";
  }
  if (error) {
    return "读取失败";
  }
  return `${subscriberCount} 个接收端 · ${readyDeliveries} 待发送 · ${suppressedDeliveries} 已静默`;
}

export function deriveBrowserConnectReadiness(surface: {
  permission: BrowserPermissionState;
  registrationState: BrowserRegistrationState;
  registrationError?: string | null;
  supported?: boolean;
}) {
  if (surface.supported === false) {
    return {
      canConnect: false,
      hint: "当前浏览器不支持通知能力，无法接入当前浏览器。",
    };
  }

  if (surface.permission !== "granted") {
    if (surface.permission === "denied") {
      return {
        canConnect: false,
        hint: "浏览器通知权限已拒绝，先重新允许，再接入当前浏览器。",
      };
    }
    return {
      canConnect: false,
      hint: "先请求浏览器通知权限，再接入当前浏览器。",
    };
  }

  if (surface.registrationState !== "ready") {
    if (surface.registrationState === "registering") {
      return {
        canConnect: false,
        hint: "浏览器接收仍在启用中，完成后再接入当前浏览器。",
      };
    }
    if (surface.registrationState === "blocked" || surface.registrationState === "error") {
      return {
        canConnect: false,
        hint: surface.registrationError || "浏览器接收当前不可用，先处理注册问题。",
      };
    }
    return {
      canConnect: false,
      hint: "先启用浏览器接收，再接入当前浏览器。",
    };
  }

  return {
    canConnect: true,
    hint: "当前浏览器已经满足接入条件。",
  };
}
