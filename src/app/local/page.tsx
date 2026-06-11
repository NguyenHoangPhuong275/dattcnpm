import AppHeader from '@/components/AppHeader';
import LocalityBrowser from '@/components/local/LocalityBrowser';

export default function LocalPage() {
  return (
    <div className="min-h-screen bg-white text-[var(--color-text)]">
      <AppHeader active="local" showSearch={false} />

      <main className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8">
        <LocalityBrowser />
      </main>
    </div>
  );
}
