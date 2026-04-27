import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSettingsNotificationSummary,
  currentBrowserSubscriberStatus,
  deriveBrowserConnectReadiness,
} from "./settings-notification-ux.ts";

test("notification summary reports loading and failure instead of fake zero counts", () => {
  assert.equal(
    buildSettingsNotificationSummary({
      loading: true,
      error: null,
      subscriberCount: 0,
      readyDeliveries: 0,
      suppressedDeliveries: 0,
    }),
    "同步中"
  );

  assert.equal(
    buildSettingsNotificationSummary({
      loading: false,
      error: "boom",
      subscriberCount: 0,
      readyDeliveries: 0,
      suppressedDeliveries: 0,
    }),
    "读取失败"
  );
});

test("notification summary keeps real counts when notifications are healthy", () => {
  assert.equal(
    buildSettingsNotificationSummary({
      loading: false,
      error: null,
      subscriberCount: 2,
      readyDeliveries: 5,
      suppressedDeliveries: 1,
    }),
    "2 个接收端 · 5 待发送 · 1 已静默"
  );
});

test("browser subscriber status only becomes ready after permission and registration are both ready", () => {
  assert.equal(currentBrowserSubscriberStatus({ permission: "default", registrationState: "idle" }), "pending");
  assert.equal(currentBrowserSubscriberStatus({ permission: "denied", registrationState: "idle" }), "blocked");
  assert.equal(currentBrowserSubscriberStatus({ permission: "granted", registrationState: "ready" }), "ready");
});

test("browser connect readiness blocks fake-positive connect actions until the browser is actually ready", () => {
  assert.deepEqual(
    deriveBrowserConnectReadiness({
      permission: "default",
      registrationState: "idle",
      supported: true,
    }),
    {
      canConnect: false,
      hint: "先请求浏览器通知权限，再接入当前浏览器。",
    }
  );

  assert.deepEqual(
    deriveBrowserConnectReadiness({
      permission: "granted",
      registrationState: "error",
      registrationError: "service worker failed",
      supported: true,
    }),
    {
      canConnect: false,
      hint: "service worker failed",
    }
  );

  assert.deepEqual(
    deriveBrowserConnectReadiness({
      permission: "granted",
      registrationState: "ready",
      supported: true,
    }),
    {
      canConnect: true,
      hint: "当前浏览器已经满足接入条件。",
    }
  );
});
