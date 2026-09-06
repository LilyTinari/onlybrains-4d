import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { evidence, series } from "@/lib/content";
import { cn, useMounted } from "@/lib/utils";

const fills = {
  lucien: series.lucien.fill,
  generic: series.generic.fill,
  lecture: series.lecture.fill,
} as const;

type Tab = (typeof evidence)[number];

function ChartTip({
  active,
  payload,
  label,
  ySuffix,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string | number;
  ySuffix: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-line bg-elevated px-3 py-2 text-xs text-fg">
      <p className="mb-1 text-subtle tabular-nums">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 py-0.5">
          <span
            className="size-1.5 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted">{p.name}</span>
          <span className="ml-auto tabular-nums">
            {p.value}
            {ySuffix}
          </span>
        </p>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
      {Object.values(series).map((s) => (
        <li key={s.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: s.fill }} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function LinePanel({ tab }: { tab: Extract<Tab, { kind: "line" }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={[...tab.data]} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="var(--color-line)" vertical={false} />
        <XAxis
          dataKey={tab.xKey}
          tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={tab.yDomain}
          tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(v: number) => `${v}${tab.ySuffix === "m" ? "" : tab.ySuffix}`}
        />
        <Tooltip
          content={<ChartTip ySuffix={tab.ySuffix} />}
          cursor={{ stroke: "var(--color-line)" }}
        />
        <Line
          type="monotone"
          dataKey="lucien"
          name={series.lucien.name}
          stroke={series.lucien.fill}
          strokeWidth={2.5}
          dot={{ r: 3, fill: series.lucien.fill, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="generic"
          name={series.generic.name}
          stroke={series.generic.fill}
          strokeWidth={1.6}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="lecture"
          name={series.lecture.name}
          stroke={series.lecture.fill}
          strokeWidth={1.6}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function BarPanel({ tab }: { tab: Extract<Tab, { kind: "bar" }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={[...tab.data]} margin={{ top: 24, right: 8, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--color-line)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip content={<ChartTip ySuffix="%" />} cursor={{ fill: "var(--color-elevated)" }} />
        <Bar dataKey="value" name="Retention" radius={[8, 8, 0, 0]} maxBarSize={88} isAnimationActive={false}>
          {tab.data.map((d) => (
            <Cell key={d.name} fill={fills[d.key]} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v: unknown) => `${v}%`}
            fill="var(--color-fg)"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Evidence() {
  const [id, setId] = useState<(typeof evidence)[number]["id"]>("retention");
  const tab = evidence.find((t) => t.id === id) ?? evidence[0];
  const mounted = useMounted();

  return (
    <section id="evidence" className="scroll-mt-24 px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-sans text-display max-w-xl font-medium tracking-tight text-fg">
          Retention, not throughput.
        </h2>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
          Lucien learns your cognitive patterns and rebuilds the path as you change.
        </p>

        <div className="mt-10 flex gap-2 overflow-x-auto pb-1">
          {evidence.map((t) => {
            const on = t.id === tab.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setId(t.id)}
                className={cn(
                  "h-11 shrink-0 rounded-full px-4 text-sm transition-[background-color,color,box-shadow] duration-150",
                  on
                    ? "bg-elevated text-fg ring-1 ring-fg/12"
                    : "text-muted hover:text-fg",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl bg-surface p-5 ring-1 ring-fg/10 md:p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h3 className="font-sans text-lg font-medium tracking-tight text-fg">
              {tab.title}
            </h3>
            {tab.kind === "line" ? <Legend /> : null}
          </div>
          <div className="h-72 md:h-80">
            {mounted && tab.kind === "line" ? <LinePanel tab={tab} /> : null}
            {mounted && tab.kind === "bar" ? <BarPanel tab={tab} /> : null}
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">{tab.copy}</p>
      </div>
    </section>
  );
}
