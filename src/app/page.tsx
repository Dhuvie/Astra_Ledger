import { DashboardShell } from "@/components/dashboard-shell";
import { isLiveDatabase } from "@/lib/db-availability";
import { getDashboardData } from "@/lib/dashboard";
import { env, isPlaidConfigured } from "@/lib/env";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const [params, data, dbLive] = await Promise.all([
    searchParams ? searchParams : Promise.resolve({ tab: undefined }),
    getDashboardData(),
    isLiveDatabase(),
  ]);

  const validTabs = [
    "overview",
    "analytics",
    "budgets",
    "goals",
    "recurring",
    "ledger",
    "simulator",
    "audit",
    "quarantine",
  ] as const;

  const tab = params?.tab;
  const initialTab =
    tab && (validTabs as readonly string[]).includes(tab)
      ? (tab as (typeof validTabs)[number])
      : "overview";

  return (
    <DashboardShell
      data={data}
      initialTab={initialTab}
      canConnectPlaid={isPlaidConfigured && dbLive}
      allowDemoToggle={!dbLive && !env.useSampleData}
    />
  );
}

