import Link from "next/link";
import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { auth } from "@/auth";
import { deleteSource } from "@/app/actions";
import { backendFetch } from "@/lib/backend";
import type { Source } from "@/lib/types";
import { PendingButton } from "@/components/PendingButton";

export default async function SourcesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const sources = await backendFetch<Source[]>("/sources");

  return (
    <main className="page stack">
      <section>
        <h1>Sources</h1>
        <p className="lead">Connected data is user-controlled. Free-tier source refreshes are available every 14 days.</p>
      </section>
      <section className="grid">
        {sources.map((source) => (
          <article className="card stack" key={source.kind}>
            <span className="status">{source.kind}</span>
            <h3>{source.external_username}</h3>
            <p className="muted">Last synced: {source.last_synced_at ? new Date(source.last_synced_at).toLocaleString() : "Never"}</p>
            <p className="muted">
              Free-tier refresh: every {String(source.summary?.refresh_interval_days ?? 14)} days
              {source.summary?.next_refresh_at ? ` - next available ${new Date(String(source.summary.next_refresh_at)).toLocaleString()}` : ""}
            </p>
            <pre className="faint">{JSON.stringify(source.summary ?? {}, null, 2)}</pre>
            <form action={deleteSource}>
              <input type="hidden" name="kind" value={source.kind} />
              <PendingButton className="danger" pendingLabel="Deleting source..."><Trash2 size={16} /> Delete source</PendingButton>
            </form>
          </article>
        ))}
        {sources.length === 0 && (
          <article className="card stack">
            <h3>No sources connected</h3>
            <Link className="button" href="/onboarding/github">Start onboarding</Link>
          </article>
        )}
      </section>
    </main>
  );
}
