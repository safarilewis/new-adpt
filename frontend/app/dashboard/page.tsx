import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, EyeOff, RefreshCcw } from "lucide-react";
import { auth } from "@/auth";
import { backendFetch } from "@/lib/backend";
import type { Evaluation, ProfileSection, Source, UserProfile } from "@/lib/types";
import { createAnalysis, publishProfile, unpublishProfile, updateProfileBasics } from "@/app/actions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [profile, sources, sections, evaluation] = await Promise.all([
    backendFetch<UserProfile>("/profile"),
    backendFetch<Source[]>("/sources"),
    backendFetch<ProfileSection[]>("/profile/sections"),
    backendFetch<Evaluation | null>("/analysis/latest")
  ]);

  const canPublish = evaluation?.status === "ready" && evaluation.reviewed;

  return (
    <main className="page stack">
      <section className="panel stack">
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <div>
            <span className="status">{profile.published ? <Eye size={14} /> : <EyeOff size={14} />} {profile.published ? "Published" : "Private"}</span>
            <h1>{profile.name ?? "Your adpt profile"}</h1>
            <p className="lead">{profile.headline ?? "Add a headline that describes your developer focus."}</p>
          </div>
          {profile.published ? (
            <form action={unpublishProfile}><button className="secondary" type="submit">Unpublish</button></form>
          ) : (
            <form action={publishProfile}><button type="submit" disabled={!canPublish}>Publish</button></form>
          )}
        </div>
        <form className="form" action={updateProfileBasics}>
          <label className="field"><span>Name</span><input name="name" defaultValue={profile.name ?? ""} /></label>
          <label className="field"><span>Headline</span><input name="headline" defaultValue={profile.headline ?? ""} /></label>
          <label className="field"><span>Profile slug</span><input name="slug" defaultValue={profile.slug} pattern="[a-z0-9-]{3,80}" /></label>
          <button className="secondary" type="submit">Save profile basics</button>
        </form>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Sources</h3>
          <p className="muted">{sources.length} connected source{sources.length === 1 ? "" : "s"}</p>
          <Link className="button secondary" href="/dashboard/sources">Manage sources</Link>
        </div>
        <div className="card">
          <h3>Manual sections</h3>
          <p className="muted">{sections.length} profile section{sections.length === 1 ? "" : "s"} saved</p>
          <Link className="button secondary" href="/onboarding/profile">Add section</Link>
        </div>
        <div className="card">
          <h3>AI analysis</h3>
          <p className="muted">{evaluation ? `${evaluation.status}${evaluation.reviewed ? " and reviewed" : ""}` : "No analysis generated yet"}</p>
          <form action={createAnalysis}>
            <button type="submit"><RefreshCcw size={16} /> Generate analysis</button>
          </form>
        </div>
      </section>

      {profile.published && (
        <section className="panel">
          <h2>Public link</h2>
          <Link className="button secondary" href={`/u/${profile.slug}`}>Open /u/{profile.slug}</Link>
        </section>
      )}
    </main>
  );
}

