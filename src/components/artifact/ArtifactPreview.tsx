'use client';

export function ArtifactPreview({ html }: { html: string }) { return <iframe title="Artifact preview" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={html} className="h-full min-h-96 w-full border" />; }
