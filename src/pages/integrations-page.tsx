import { useState } from 'react'
import {
  Server,
  ShieldAlert,
  Copy,
  Check,
  Terminal,
  Flame,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function IntegrationsPage() {
  const { configured, isDemoMode } = useAuth()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const botExampleCode = `// 7dc Bot Bridge Client (Node.js + discord.js v14)
// Este código roda no container da Discloud e sincroniza com o banco Firebase/Firestore

import { Client, GatewayIntentBits } from 'discord.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "artemis-e4d33.firebaseapp.com",
  projectId: "artemis-e4d33",
  storageBucket: "artemis-e4d33.firebasestorage.app",
  messagingSenderId: "96268694719",
  appId: "1:96268694719:web:a94b147607f8fa52d8020a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DISCLOUD_APP_ID = process.env.DISCLOUD_APP_ID || 'sentinel-prod-01';

async function fetchBotSettings() {
  const docRef = doc(db, 'bot_settings', DISCLOUD_APP_ID);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', async () => {
  console.log(\`[7dc] Bot conectado como \${client.user.tag}\`);
  const settings = await fetchBotSettings();
  console.log('[7dc] Preferências do Firebase carregadas:', settings);
});

client.login(process.env.DISCORD_BOT_TOKEN);`

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="pb-2 border-b border-neutral-800/80">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Central de Conexões & Firebase
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Conexão ativa com o banco de dados Firebase Firestore, Auth e Discloud API.
        </p>
      </div>

      {/* Grid de Conexões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Firebase */}
        <Card className="bg-neutral-900/40 border-neutral-800/80">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">
                    Firebase Firestore & Auth
                  </CardTitle>
                  <CardDescription className="text-[11px] text-neutral-400">
                    Projeto: artemis-e4d33
                  </CardDescription>
                </div>
              </div>
              <Badge variant={configured ? 'success' : 'warning'}>
                {configured ? 'Conectado' : 'Aguardando'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-3">
            <p className="text-xs text-neutral-400 leading-relaxed">
              O banco de dados do 7dc está conectado ao Firestore do Google Cloud, sincronizando em tempo real as coleções de bots, configurações, comandos e logs.
            </p>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-400 space-y-1">
              <div>projectId: <strong className="text-neutral-200">artemis-e4d33</strong></div>
              <div>authDomain: <span className="text-neutral-300">artemis-e4d33.firebaseapp.com</span></div>
              <div>storageBucket: <span className="text-neutral-300">artemis-e4d33.firebasestorage.app</span></div>
              <div className="text-emerald-400 text-[10px] pt-1">
                ✓ Firestore SDK v11 inicializado com sucesso
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Discloud */}
        <Card className="bg-neutral-900/40 border-neutral-800/80">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">
                    Discloud Hosting API
                  </CardTitle>
                  <CardDescription className="text-[11px] text-neutral-400">
                    Gerenciamento de containers e status
                  </CardDescription>
                </div>
              </div>
              <Badge variant={isDemoMode ? 'warning' : 'outline'}>
                {isDemoMode ? 'Sandbox Ativo' : 'Pronto p/ Token'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-3">
            <p className="text-xs text-neutral-400 leading-relaxed">
              As operações com a Discloud ocorrem exclusivamente via backend. O token da Discloud nunca é exposto ao navegador do administrador.
            </p>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-400 space-y-1">
              <div className="text-neutral-500 font-sans font-medium">VARIÁVEL SERVER-SIDE:</div>
              <div>DISCLOUD_API_TOKEN=••••••••••••••••••••••••</div>
              <div className="text-neutral-500 pt-1 font-sans">
                Status: {isDemoMode ? 'Simulado via Sandbox' : 'Segredo pronto'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diretrizes de Segurança */}
      <Card className="bg-neutral-900/40 border-neutral-800/80">
        <CardHeader className="p-5 border-b border-neutral-800/80">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            Políticas de Segurança e Isolamento do 7dc
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-2 text-xs text-neutral-400 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800">
              <h4 className="font-semibold text-neutral-200 mb-1">
                Zero Token no Frontend
              </h4>
              <p className="text-[11px] text-neutral-500">
                Nem o token do bot Discord nem o token da Discloud são enviados ao navegador.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800">
              <h4 className="font-semibold text-neutral-200 mb-1">
                Ações com Confirmação
              </h4>
              <p className="text-[11px] text-neutral-500">
                Parar ou reiniciar aplicações exige confirmação prévia no modal antes da chamada de rede.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800">
              <h4 className="font-semibold text-neutral-200 mb-1">
                Regras de Segurança Firestore
              </h4>
              <p className="text-[11px] text-neutral-500">
                Apenas administradores autenticados com permissão gravam nos documentos de bots.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Código Exemplo do Bot Discord com Firebase */}
      <Card className="bg-neutral-900/40 border-neutral-800/80">
        <CardHeader className="p-5 border-b border-neutral-800/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-neutral-400" />
                Modelo de Conexão do Bot Discord (Node.js + Firebase SDK)
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400 mt-0.5">
                Estrutura recomendada para o bot carregar suas configurações do Firestore com segurança.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(botExampleCode, 1)}
              className="text-xs border-neutral-800 text-neutral-300 hover:text-white"
            >
              {copiedIndex === 1 ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-emerald-400" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" /> Copiar Código
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-3">
          <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed">
            {botExampleCode}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
