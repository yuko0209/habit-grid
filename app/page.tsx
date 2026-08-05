import HabitApp from "./components/HabitApp";

export default function Home() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-3xl px-5 py-10 sm:py-16">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Habit Grid</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            毎日の習慣をグリッドで記録する。データはブラウザ内にのみ保存されます。
          </p>
        </header>

        <HabitApp />
      </main>
    </div>
  );
}
