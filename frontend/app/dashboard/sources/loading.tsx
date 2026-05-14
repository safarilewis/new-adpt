import { LoadingTips } from "@/components/LoadingTips";

export default function SourcesLoading() {
  return (
    <main className="page loader-page">
      <LoadingTips label="Checking connected sources" />
    </main>
  );
}

