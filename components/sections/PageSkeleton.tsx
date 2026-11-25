/** Brief placeholder shown while a dynamic page streams in during client navigation. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="border-b border-line">
      <div className="container-x animate-pulse pb-20 pt-8">
        <div className="h-3 w-40 bg-canvas-2" />
        <div className="mt-14 h-3 w-32 bg-canvas-2" />
        <div className="mt-6 h-14 w-full max-w-2xl bg-canvas-2" />
        <div className="mt-3 h-14 w-full max-w-lg bg-canvas-2" />
      </div>
    </div>
  );
}
