import { usePwa } from './pwa';

export function UpdateModal() {
  const { updateAvailable, acceptUpdate } = usePwa();
  if (!updateAvailable) return null;

  return (
    <div className="update-backdrop" role="presentation">
      <section className="update-modal" role="dialog" aria-modal="true" aria-labelledby="update-title">
        <h2 id="update-title">Update available</h2>
        <p>A newer version of Indo Reader is ready. Refresh to use it now.</p>
        <button type="button" onClick={acceptUpdate}>Refresh now</button>
      </section>
    </div>
  );
}
