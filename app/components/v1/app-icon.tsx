export const AppIcon = () => {
  return (
    <div className="flex flex-col sm:flex-col lg:flex-row items-center gap-2 p-2 [&[data-state=collapsed]>h1]:hidden">
      <img src="/favicon.ico" alt="Dakon Clash" className="w-10 sm:w-12" />
      <h1 className="text-xl sm:text-2xl font-bold text-slate-700">
        Dakon Clash
      </h1>
    </div>
  );
};
