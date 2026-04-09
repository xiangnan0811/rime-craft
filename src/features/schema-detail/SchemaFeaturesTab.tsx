export function SchemaFeaturesTab({ features }: { features: string[] }) {
  return <ul>{features.map((f) => <li key={f}>{f}</li>)}</ul>
}
