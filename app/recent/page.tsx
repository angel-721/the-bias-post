export default function RecentPage() {
  return (
    <>
      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Masthead */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl font-black tracking-tight mb-4">
            THE BIAS POST
          </h1>
          <div className="w-32 h-0.5 bg-accent mx-auto"></div>
        </div>

        {/* Coming Soon */}
        <div className="text-center py-16">
          <h2 className="font-display text-3xl font-bold mb-6">COMING SOON</h2>

          <p className="text-lg text-text-secondary leading-relaxed mb-4">
            Recent analyses and trending articles
            will appear here.
          </p>

          <p className="text-text-secondary">Check back soon.</p>
        </div>
      </main>
    </>
  );
}
