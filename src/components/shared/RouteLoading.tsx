interface RouteLoadingProps {
  label?: string
}

export function RouteLoading({ label = '加载中...' }: RouteLoadingProps) {
  return <div className="p-8 text-muted-foreground">{label}</div>
}
