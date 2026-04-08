"use client";

type LocalTimeProps = {
  value?: string;
  withSeconds?: boolean;
};

function formatLocalTime(value: string, withSeconds: boolean) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "n/a";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
  }).format(date);
}

function formatLocalTooltip(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "long",
  }).format(date);
}

export function LocalTime({ value, withSeconds = false }: LocalTimeProps) {
  const formatted = value ? formatLocalTime(value, withSeconds) : "n/a";
  const tooltip = value ? formatLocalTooltip(value) : "";

  return (
    <time dateTime={value} title={tooltip || undefined} suppressHydrationWarning>
      {formatted}
    </time>
  );
}
