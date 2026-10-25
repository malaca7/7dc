import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/auth-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'

import { LoginPage } from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { BotsPage } from '@/pages/bots-page'
import { BotDetailsPage } from '@/pages/bot-details-page'
import { SettingsPage } from '@/pages/settings-page'
import { LogsPage } from '@/pages/logs-page'
import { IntegrationsPage } from '@/pages/integrations-page'

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <HashRouter>
            <Routes>
              {/* Rota Pública de Autenticação */}
              <Route path="/login" element={<LoginPage />} />

              {/* Rotas Administrativas Protegidas */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/bots" element={<BotsPage />} />
                <Route path="/bots/:id" element={<BotDetailsPage />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
                <Route path="/settings" element={<Navigate to="/configuracoes" replace />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/integracoes" element={<IntegrationsPage />} />
              </Route>

              {/* Rota Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
