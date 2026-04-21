package store

import "testing"

func TestInboxItemActionLabelUsesKnownTargetNames(t *testing.T) {
	cases := []struct {
		name string
		href string
		want string
	}{
		{name: "run detail", href: "/rooms/room-runtime/runs/run_runtime_01", want: "执行详情"},
		{name: "room pr", href: "/rooms/room-runtime?tab=pr", want: "讨论间 PR"},
		{name: "room run tab", href: "/rooms/room-runtime?tab=run", want: "讨论间执行面"},
		{name: "room context tab", href: "/rooms/room-runtime?tab=context", want: "讨论间上下文"},
		{name: "room", href: "/rooms/room-runtime", want: "进入讨论间"},
		{name: "setup", href: "/setup", want: "设置"},
		{name: "mailbox focus", href: "/mailbox?roomId=room-runtime&handoffId=handoff-runtime", want: "当前交接"},
		{name: "mailbox", href: "/mailbox?roomId=room-runtime", want: "交接箱"},
		{name: "inbox focus", href: "/inbox?handoffId=handoff-runtime&roomId=room-runtime", want: "收件箱定位"},
		{name: "inbox", href: "/inbox?kind=blocked", want: "收件箱"},
		{name: "unknown", href: "/opaque/legacy-target", want: ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := InboxItemActionLabel(tc.href); got != tc.want {
				t.Fatalf("InboxItemActionLabel(%q) = %q, want %q", tc.href, got, tc.want)
			}
		})
	}
}

func TestMailboxHrefLabelUsesCustomerFacingNames(t *testing.T) {
	cases := []struct {
		name   string
		status string
		href   string
		want   string
	}{
		{name: "active handoff", status: "active", href: "/mailbox?roomId=room-runtime&handoffId=handoff-runtime", want: "当前交接"},
		{name: "ready route", status: "ready", href: "/mailbox?roomId=room-runtime", want: "交接建议"},
		{name: "blocked route", status: "blocked", href: "/mailbox?roomId=room-runtime", want: "待处理升级"},
		{name: "default mailbox", status: "done", href: "/mailbox?roomId=room-runtime", want: "交接箱"},
		{name: "unknown", status: "blocked", href: "/opaque/legacy-target", want: ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := MailboxHrefLabel(tc.status, tc.href); got != tc.want {
				t.Fatalf("MailboxHrefLabel(%q, %q) = %q, want %q", tc.status, tc.href, got, tc.want)
			}
		})
	}
}
