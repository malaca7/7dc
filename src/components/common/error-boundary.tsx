import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[7dc ErrorBoundary] Erro capturado:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-full bg-red-950/40 border border-red-900/50 mb-4">
            <AlertOctagon className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            Ocorreu uma falha inesperada
          </h1>
          <p className="text-xs text-neutral-400 max-w-md mb-6 leading-relaxed">
            O sistema encontrou um erro durante a renderização. Os logs foram registrados de forma segura.
          </p>
          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-red-300 max-w-lg overflow-x-auto mb-6 text-left w-full">
            {this.state.error?.message || 'Erro desconhecido'}
          </div>
          <Button
            onClick={this.handleReset}
            className="bg-white text-black hover:bg-neutral-200 text-xs font-medium"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Recarregar Aplicação
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
