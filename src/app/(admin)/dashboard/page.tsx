import { StatCard } from "@/components/StatCard";
import { Contact } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function countByKey(rows: Pick<Contact, "suburb" | "source">[], key: "suburb" | "source") {
  return rows.reduce<Record<string, number>>((accumulator, row) => {
    const label = row[key] || "Not specified";
    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});
}

function topEntries(groups: Record<string, number>) {
  return Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const [totalResult, monthResult, volunteerResult, followUpResult, groupResult] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", firstDayOfMonth.toISOString()),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("volunteer_interest", true),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("follow_up_needed", true),
    supabase
      .from("contacts")
      .select("suburb, source")
      .order("created_at", { ascending: false })
      .limit(1000)
  ]);

  const groupRows = (groupResult.data || []) as Pick<Contact, "suburb" | "source">[];
  const suburbCounts = topEntries(countByKey(groupRows, "suburb"));
  const sourceCounts = topEntries(countByKey(groupRows, "source"));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">Dashboard</h2>
        <p className="mt-1 text-sm text-muted">A quick view of contacts, follow-up load, and collection channels.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Contacts" value={totalResult.count || 0} />
        <StatCard label="New Contacts This Month" value={monthResult.count || 0} />
        <StatCard label="Volunteer Interested" value={volunteerResult.count || 0} />
        <StatCard label="Follow-up Needed" value={followUpResult.count || 0} href="/follow-ups" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h3 className="text-base font-semibold text-ink">Contacts by Suburb</h3>
          <p className="mt-1 text-xs text-muted">Based on the latest 1000 contacts to keep usage predictable.</p>
          <div className="mt-4 space-y-3">
            {suburbCounts.length > 0 ? (
              suburbCounts.map(([label, count]) => (
                <div key={label} className="flex items-center justify-between border-b border-line pb-2 text-sm">
                  <span className="font-medium text-ink">{label}</span>
                  <span className="text-muted">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No contacts yet.</p>
            )}
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="text-base font-semibold text-ink">Contacts by Source</h3>
          <p className="mt-1 text-xs text-muted">Based on the latest 1000 contacts to keep usage predictable.</p>
          <div className="mt-4 space-y-3">
            {sourceCounts.length > 0 ? (
              sourceCounts.map(([label, count]) => (
                <div key={label} className="flex items-center justify-between border-b border-line pb-2 text-sm">
                  <span className="font-medium text-ink">{label}</span>
                  <span className="text-muted">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No contacts yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
