export function PlaceholderPage({ title, description }) {
  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">{title}</h1>
        <p className="app-page-subtitle">{description || 'Coming soon'}</p>
      </div>
      <div className="app-surface p-6">
        <p className="text-sm text-muted-foreground">
          This module is structured and ready for detailed workflows.
        </p>
      </div>
    </section>
  );
}
