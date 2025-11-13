import { RepoCard } from "../repo-card";

export default function RepoCardExample() {
  return (
    <div className="p-4 max-w-md">
      <RepoCard
        name="react-typescript-starter"
        description="A modern React + TypeScript starter template with Vite, TailwindCSS, and best practices"
        technologies={["React", "TypeScript", "Vite", "Tailwind"]}
        stars={245}
      />
    </div>
  );
}
