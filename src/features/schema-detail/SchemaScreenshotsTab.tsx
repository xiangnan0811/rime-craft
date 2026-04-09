export function SchemaScreenshotsTab({ schemaId, screenshots }: { schemaId: string; screenshots: string[] }) {
  if (screenshots.length === 0) return <p className="text-gray-500">暂无截图</p>
  return <div>{screenshots.map((s) => <img key={s} src={`/screenshots/${schemaId}/${s}`} alt="" />)}</div>
}
