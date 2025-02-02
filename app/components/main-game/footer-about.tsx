import { AppIcon } from "./AppIcon";

export function FooterAbout() {
  return (
    <div className="px-4 py-2 flex flex-col gap-4">
      <AppIcon /> 
        <p className="text-sm text-center">
        Dakon Clash is a two-player strategy game where the goal is to capture the most seeds.
      </p>
      <a
        href="https://github.com/rasyidf/dakonclash"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-center block bg-slate-50 text-slate-900 font-semibold hover:underline"
      >
        Github
      </a>
      <div className="flex justify-center mt-4 space-x-4">
        <span className="text-sm text-slate-500">&copy; 2025 Subsidi Tepat Teams</span>
      </div>
    </div>
  );
}
