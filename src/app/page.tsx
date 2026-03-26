import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardData } from "@/lib/dashboard";
import { isDatabaseConfigured, isPlaidConfigured } from "@/lib/env";

export default async function Home() {
  const data = await getDashboardData();

  return (
    <DashboardShell
      data={data}
      canConnectPlaid={isPlaidConfigured && isDatabaseConfigured}
    />
  );
}

