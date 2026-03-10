export default function LensPage() {
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options);
  };

  return (
    <>
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Section Label */}
        <div className="text-accent text-xs font-bold uppercase tracking-widest mb-4">
          Lens
        </div>

        {/* Divider */}
        <div className="border-b border-border-color mb-8"></div>

        {/* Headline */}
        <h1 className="font-display text-4xl font-black leading-tight mb-6 text-text-primary">
          Why I Built a Bias Detector
        </h1>

        {/* Byline */}
        <div className="text-sm text-text-secondary mb-8">
          By <span className="font-medium">Angel Velasquez</span>
          <span className="mx-2">·</span>
          {formatDate()}
        </div>

        {/* Divider */}
        <div className="border-b border-border-color mb-8"></div>

        {/* Lede */}
        <p className="font-serif text-xl leading-relaxed text-text-primary mb-8">
          lede
        </p>

        {/* Body */}
        <div className="font-serif text-base leading-loose text-text-primary space-y-6">
          <p>p1</p>

          {/* Pull Quote 
          <blockquote className="border-l-4 border-accent pl-6 py-4 my-8 bg-bg-surface italic text-lg">
            "The goal isn't to tell people what to think, but to show them how
            language shapes thinking—often in ways we never notice."
          </blockquote>
					*/}
        </div>
      </main>
    </>
  );
}
