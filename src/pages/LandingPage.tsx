import {
  ArrowRight,
  Blocks,
  Check,
  Cloud,
  CloudLightning,
  Database,
  FileText,
  HardDrive,
  Layers,
  Lock,
  Network,
  Server,
  Shield,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { useLang } from '../lang';

type ShellCtx = { studioUrl?: string };

export default function LandingPage() {
  const { studioUrl } = useOutletContext<ShellCtx>();
  const studio = studioUrl || 'https://solvamos-studio-74094114833.asia-northeast3.run.app';
  const { lang, t } = useLang();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero — identical structure to solvamos.ai.studio overview */}
      <section className="relative overflow-hidden pt-12 lg:pt-20">
        <div className="pointer-events-none absolute top-1/4 left-1/2 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/10 blur-[120px]" />
        <div className="relative z-10 text-center">
          <div className="mb-8 inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-slate-900/90 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 shadow-lg shadow-cyan-500/10">
            <Sparkles className="h-4 w-4 animate-pulse text-cyan-400" />
            <span>
              {t(
                'GCP Vertex AI RAG × Solana pay.sh 402 온체인 정산 연동',
                'GCP Vertex AI RAG × Solana pay.sh 402 On-Chain Settlement Protocol'
              )}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </div>

          <h1 className="mx-auto max-w-5xl text-4xl leading-[1.15] font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            {lang === 'kr' ? (
              <>
                사내 문서와 데이터를{' '}
                <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  0.01 USDC 유료 AI 에이전트
                </span>
                로 전환하세요
              </>
            ) : (
              <>
                Monetize Your Business Data into{' '}
                <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  Paid AI Agents
                </span>{' '}
                Powered by Solana
              </>
            )}
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            {t(
              'SolVamos Studio는 Google Workspace Drive 및 사내 지식 기반을 Vertex AI Vector RAG로 인덱싱하고, Solana pay.sh 402 Payment Required 미들웨어로 결제를 적용하여 A2A(Agent-to-Agent) REST API 엔드포인트로 유료화하는 B2B 플랫폼입니다.',
              'SolVamos Studio indexes enterprise documents via GCP Vertex AI RAG and enforces Solana pay.sh 402 micropayments over REST API endpoints for seamless Agent-to-Agent (A2A) integration.'
            )}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={studio}
              className="group flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] hover:shadow-cyan-500/40 sm:w-auto"
            >
              <Zap className="h-5 w-5 fill-cyan-300/30 text-cyan-300 group-hover:animate-bounce" />
              <span>{t('3분 만에 AI 에이전트 배포하기', 'Deploy Agent in 3 Mins')}</span>
              <ArrowRight className="h-5 w-5 text-slate-200 transition-transform group-hover:translate-x-1" />
            </a>
            <Link
              to="/marketplace"
              className="flex w-full items-center justify-center space-x-2 rounded-xl border border-slate-700 bg-slate-900 px-8 py-4 text-base font-semibold text-slate-200 transition-all hover:border-slate-500 hover:bg-slate-800 sm:w-auto"
            >
              <Layers className="h-5 w-5 text-indigo-400" />
              <span>{t('라이브 에이전트 살펴보기', 'Explore Live Services')}</span>
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-6 border-t border-slate-800/80 pt-10 text-sm font-medium text-slate-400 md:grid-cols-4">
            <div className="flex items-center justify-center space-x-2">
              <Database className="h-5 w-5 text-cyan-400" />
              <span>GCP Vertex AI Vector Search</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Wallet className="h-5 w-5 text-indigo-400" />
              <span>Solana pay.sh xNFT 402</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Network className="h-5 w-5 text-purple-400" />
              <span>A2A REST API Protocol Standard</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CloudLightning className="h-5 w-5 text-emerald-400" />
              <span>GCP Cloud Run Serverless</span>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section>
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl sm:p-10">
          <div className="absolute top-0 right-0 flex items-center space-x-2 rounded-bl-2xl border-b border-l border-cyan-500/20 bg-cyan-500/10 p-4 font-mono text-[11px] text-cyan-400">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
            <span>SYSTEM ARCHITECTURE DIAGRAM</span>
          </div>
          <h2 className="mb-2 text-xl font-bold text-white sm:text-2xl">
            {t('엔드투엔드 파이프라인 아키텍처', 'End-to-End Pipeline Architecture')}
          </h2>
          <p className="mb-8 text-sm text-slate-400">
            {t(
              '문서 수집부터 온체인 마이크로 결제 검증, A2A REST API 응답까지 300ms 이내로 처리하는 구조입니다.',
              'How Enterprise Knowledge, Solana 402 Auth, and A2A REST APIs communicate under 300ms latency.'
            )}
          </p>
          <div className="relative grid grid-cols-1 gap-4 md:grid-cols-4">
            <ArchCard
              tone="cyan"
              icon={<HardDrive className="h-5 w-5 text-cyan-400" />}
              step="Step 1: Ingestion"
              title="Google Drive & Docs"
              desc={t(
                '사내 취업규칙, 법률 계약서, SRE 런북 동기화',
                'Sync Google Drive, Notion & PDF files in real-time'
              )}
              foot="GCP Vertex Vector DB"
            />
            <ArchCard
              tone="indigo"
              icon={<Lock className="h-5 w-5 text-indigo-400" />}
              step="Step 2: 402 Auth"
              title="Solana pay.sh Gateway"
              desc={t(
                'HTTP 402 Payment Required 수신 → $0.01 USDC 검증',
                'HTTP 402 Payment Required & 0.01 USDC xNFT Auth'
              )}
              foot="Solana Mainnet-Beta"
            />
            <ArchCard
              tone="purple"
              icon={<Cloud className="h-5 w-5 text-purple-400" />}
              step="Step 3: RAG Processing"
              title="Google Cloud AI Application & KMS"
              desc={t(
                'Google Cloud AI Application 기반 Vertex RAG 추론',
                'Vertex AI RAG inference with enterprise grounding'
              )}
              foot="Vertex AI + KMS"
            />
            <ArchCard
              tone="emerald"
              icon={<Server className="h-5 w-5 text-emerald-400" />}
              step="Step 4: A2A Delivery"
              title="REST API Endpoint"
              desc={t(
                '에이전트 간 JSON 응답 및 정산 영수증 반환',
                'Agent-to-Agent JSON response + settlement receipt'
              )}
              foot="Cloud Run /pay fetch"
            />
          </div>
        </div>
      </section>

      {/* 3-step workflow */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {t(
              '3단계로 끝나는 AI 에이전트 수익화 워크플로우',
              'Monetize Enterprise Intelligence in 3 Easy Steps'
            )}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
            {t(
              '개발자 없이도 구글 드라이브 연결부터 Solana 자동 정산까지 완성합니다.',
              'From Google Drive sync to automated Solana USDC settlements without writing boilerplate code.'
            )}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              n: 1,
              title: t('드라이브 연결', 'Connect Drive'),
              body: t(
                'Google Drive / Docs를 연결하면 Vertex Vector DB에 자동 인덱싱됩니다.',
                'Connect Drive/Docs and auto-index into Vertex Vector DB.'
              ),
              code: 'gdrive_sync.init()',
            },
            {
              n: 2,
              title: t('요금·지갑 설정', 'Set Fee & Wallet'),
              body: t(
                '호출당 USDC 요금과 수취 지갑을 지정합니다. pay.sh 402가 자동 적용됩니다.',
                'Set per-call USDC fee and payout wallet. pay.sh 402 attaches automatically.'
              ),
              code: 'fee = 0.01 USDC',
            },
            {
              n: 3,
              title: t('엔드포인트 배포', 'Deploy Endpoint'),
              body: t(
                'A2A REST URL이 발급되고 카탈로그에 게시됩니다. pay fetch로 즉시 호출 가능합니다.',
                'A2A REST URL is issued and listed on the catalog. Call instantly with pay fetch.'
              ),
              code: 'POST /api/v1/invoke',
            },
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => setStep(s.n)}
              className={`rounded-2xl border p-6 text-left transition-all ${
                step === s.n
                  ? 'border-cyan-500/50 bg-slate-900 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-sm font-bold text-white">
                {s.n}
              </div>
              <h3 className="text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-cyan-300">
                <span className="text-slate-500">$</span> {s.code}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {t('스튜디오 요금제', 'Studio Pricing')}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {t('에이전트 생성·배포는 Studio에서. 카탈로그 검색은 무료입니다.', 'Create & deploy in Studio. Catalog discovery is free.')}
          </p>
          <div className="mt-6 inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold ${
                billing === 'monthly' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold ${
                billing === 'yearly' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <PriceCard
            name="Starter"
            price={billing === 'monthly' ? '$0' : '$0'}
            period={t('/월', '/mo')}
            features={[
              t('공개 카탈로그 검색', 'Public catalog browse'),
              t('pay.sh 402 호출', 'pay.sh 402 invoke'),
              t('1 에이전트 체험', '1 agent trial'),
            ]}
            cta={t('카탈로그 열기', 'Open Catalog')}
            href="/marketplace"
            internal
          />
          <PriceCard
            name="Pro"
            price={billing === 'monthly' ? '$49' : '$470'}
            period={billing === 'monthly' ? t('/월', '/mo') : t('/년', '/yr')}
            popular
            features={[
              t('무제한 에이전트 배포', 'Unlimited agent deploys'),
              t('Vertex RAG + Drive 동기화', 'Vertex RAG + Drive sync'),
              t('카탈로그 자동 게시', 'Auto-list on catalog'),
              t('USDC 자동 정산', 'USDC auto-settlement'),
            ]}
            cta={t('Studio에서 시작', 'Start in Studio')}
            href={studio}
          />
          <PriceCard
            name="Enterprise"
            price={t('문의', 'Custom')}
            period=""
            features={[
              t('전용 VPC / KMS', 'Dedicated VPC / KMS'),
              t('SLA · 감사 로그', 'SLA & audit logs'),
              t('프라이빗 카탈로그', 'Private catalog'),
            ]}
            cta={t('영업 문의', 'Contact Sales')}
            href={studio}
          />
        </div>
      </section>

      {/* Feature grid */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <FileText className="h-5 w-5 text-cyan-400" />,
              title: t('문서 기반 RAG', 'Document RAG'),
              body: t('사내 PDF·Drive를 Vertex로 인덱싱', 'Index PDFs & Drive into Vertex'),
            },
            {
              icon: <Shield className="h-5 w-5 text-indigo-400" />,
              title: t('HTTP 402 결제', 'HTTP 402 Payments'),
              body: t('호출마다 USDC 마이크로결제', 'Per-call USDC micropayments'),
            },
            {
              icon: <Blocks className="h-5 w-5 text-purple-400" />,
              title: t('공개 카탈로그', 'Public Catalog'),
              body: t('배포한 에이전트를 마켓에 노출', 'List deployed agents on marketplace'),
            },
            {
              icon: <Zap className="h-5 w-5 text-cyan-400" />,
              title: t('A2A REST', 'A2A REST'),
              body: t('에이전트 간 표준 REST 호출', 'Standard agent-to-agent REST'),
            },
            {
              icon: <Wallet className="h-5 w-5 text-indigo-400" />,
              title: t('온체인 정산', 'On-chain Settlement'),
              body: t('Solana pay.sh 영수증 검증', 'Solana pay.sh receipt verify'),
            },
            {
              icon: <CloudLightning className="h-5 w-5 text-emerald-400" />,
              title: t('Cloud Run', 'Cloud Run'),
              body: t('서버리스 스케일 엔드포인트', 'Serverless scalable endpoints'),
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 transition-all hover:border-cyan-500/30"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 p-8 text-center sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10" />
          <h2 className="relative text-2xl font-bold text-white sm:text-3xl">
            {t('지금 Studio에서 첫 에이전트를 배포하세요', 'Deploy your first agent in Studio now')}
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-slate-300">
            {t(
              '카탈로그는 검색·발견, Studio는 생성·정산. 같은 SolVamos 스택입니다.',
              'Catalog for discovery. Studio for create & settle. Same SolVamos stack.'
            )}
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={studio}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25"
            >
              {t('Studio 열기', 'Open Studio')}
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-950/80 px-8 py-3.5 text-sm font-semibold text-slate-200"
            >
              {t('라이브 서비스', 'Live Services')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ArchCard({
  tone,
  icon,
  step,
  title,
  desc,
  foot,
}: {
  tone: 'cyan' | 'indigo' | 'purple' | 'emerald';
  icon: ReactNode;
  step: string;
  title: string;
  desc: string;
  foot: string;
}) {
  const border =
    tone === 'cyan'
      ? 'hover:border-cyan-500/40'
      : tone === 'indigo'
        ? 'border-indigo-500/30 hover:border-indigo-500/60'
        : tone === 'purple'
          ? 'border-purple-500/30 hover:border-purple-500/60'
          : 'border-emerald-500/30 hover:border-emerald-500/60';
  const chip =
    tone === 'cyan'
      ? 'border-cyan-500/30 bg-cyan-500/10'
      : tone === 'indigo'
        ? 'border-indigo-500/30 bg-indigo-500/10'
        : tone === 'purple'
          ? 'border-purple-500/30 bg-purple-500/10'
          : 'border-emerald-500/30 bg-emerald-500/10';
  const label =
    tone === 'cyan'
      ? 'text-cyan-400'
      : tone === 'indigo'
        ? 'text-indigo-400'
        : tone === 'purple'
          ? 'text-purple-400'
          : 'text-emerald-400';

  return (
    <div className={`group rounded-xl border border-slate-800 bg-slate-950 p-5 transition-all ${border}`}>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg border ${chip}`}>{icon}</div>
      <span className={`text-xs font-mono uppercase tracking-wider ${label}`}>{step}</span>
      <h3 className="mt-1 text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{desc}</p>
      <div className="mt-3 rounded bg-slate-900 p-2 font-mono text-[11px] text-slate-500">{foot}</div>
    </div>
  );
}

function PriceCard({
  name,
  price,
  period,
  features,
  cta,
  href,
  popular,
  internal,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  popular?: boolean;
  internal?: boolean;
}) {
  const ctaClass = `mt-8 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition-all ${
    popular
      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
      : 'border border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500'
  }`;

  return (
    <div
      className={`relative rounded-2xl border p-6 ${
        popular
          ? 'border-cyan-500/50 bg-slate-900 shadow-xl shadow-cyan-500/10'
          : 'border-slate-800 bg-slate-900/70'
      }`}
    >
      {popular ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-3 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
          Most Popular
        </div>
      ) : null}
      <div className="text-sm font-semibold text-slate-300">{name}</div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-black text-white">{price}</span>
        {period ? <span className="text-sm text-slate-500">{period}</span> : null}
      </div>
      <ul className="mt-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            {f}
          </li>
        ))}
      </ul>
      {internal ? (
        <Link to={href} className={ctaClass}>
          {cta}
        </Link>
      ) : (
        <a href={href} className={ctaClass}>
          {cta}
        </a>
      )}
    </div>
  );
}
