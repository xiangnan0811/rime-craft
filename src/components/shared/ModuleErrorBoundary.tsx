import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  moduleName: string
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`模块「${this.props.moduleName}」渲染出错:`, error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          模块「{this.props.moduleName}」加载出错，请刷新页面重试。
        </div>
      )
    }
    return this.props.children
  }
}
