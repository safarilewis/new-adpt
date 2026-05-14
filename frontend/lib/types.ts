export type Source = {
  kind: "github" | "leetcode";
  external_username: string;
  last_synced_at: string | null;
  summary: Record<string, unknown> | null;
};

export type UserProfile = {
  id: string;
  email: string | null;
  name: string | null;
  slug: string;
  headline: string | null;
  published: boolean;
};

export type ProfileSection = {
  id: string;
  kind: "education" | "experience" | "certification" | "bootcamp" | "project";
  title: string;
  organization: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  url: string | null;
  order: number;
};

export type Evaluation = {
  id: string;
  status: "queued" | "running" | "ready" | "failed";
  summary: string | null;
  skill_model: Record<string, unknown> | null;
  strengths: string[] | null;
  growth_areas: string[] | null;
  project_complexity_notes: string[] | null;
  evidence_highlights: string[] | null;
  recruiter_copy: string | null;
  error: string | null;
  reviewed: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicProfile = {
  user: UserProfile;
  sections: ProfileSection[];
  repositories: {
    full_name: string;
    description: string | null;
    language: string | null;
    stars: number;
    forks: number;
    open_issues: number;
    pushed_at: string | null;
  }[];
  leetcode: {
    username: string;
    total_solved: number;
    easy_solved: number;
    medium_solved: number;
    hard_solved: number;
    ranking: number | null;
    created_at: string;
  } | null;
  evaluation: Evaluation | null;
};

