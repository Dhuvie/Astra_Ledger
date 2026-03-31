import { DashboardShell } from "@/components/dashboard-shell";
import { isLiveDatabase } from "@/lib/db-availability";
import { getDashboardData } from "@/lib/dashboard";
import { env, isPlaidConfigured } from "@/lib/env";

export default async function Home() {
  const [data, dbLive] = await Promise.all([getDashboardData(), isLiveDatabase()]);

  return (
    <DashboardShell
      data={data}
      canConnectPlaid={isPlaidConfigured && dbLive}
      allowDemoToggle={!dbLive && !env.useSampleData}
    />
  );
}

