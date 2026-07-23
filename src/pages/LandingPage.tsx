import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Boxes,
  Cloud,
  Cpu,
  Link2,
  Shield,
  Sparkles,
  Wallet,
} from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import type { CatalogResponse } from '../types';

export default function LandingPage() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);

  useEffect(() => {
    void fetch('/api/catalog', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: CatalogResponse) => {
        if (data.status === 'success' || data.agents) setCatalog(data);
      })
      .catch(() => undefined);
  }, []);

  const studioUrl = catalog?.studio_url || 'https://solvamos.ai.studio';

  return (
    <div className="mesh min-h-screen text-on-surface">
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-8 md:px-10 md:pt-10">
        <SiteHeader studioUrl={studioUrl} />

        {/* Hero — solvamos.ai.studio composition */}
        <header className="relative mb-16 overflow-hidden rounded-2xl border border-white/10 px-6 py-14 md:px-12 md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(66,133,244,0.26),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(20,241,149,0.14),transparent_50%)]" />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-solana-green md:text-sm">
              GCP Vertex AI RAG × Solana x402/MPP 온체인 정산
            </p>
            <div className="mb-6 flex items-center gap-4">
              <img
                src="/logo.png"
                alt="SolVamos"
                className="h-14 w-14 object-contain md:h-16 md:w-16"
              />
              <h1 className="text-4xl font-bold tracking-tight text-primary md:text-6xl">
                SolVamos
              </h1>
            </div>
            <h2 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-on-surface md:text-4xl">
              사내 문서와 데이터를 유료 AI 에이전트로 전환하고,
              <br className="hidden md:block" /> 공개 카탈로그에서 바로 호출하세요
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-on-surface-variant md:text-lg">
              SolVamos Catalog는 Studio에서 게시한 에이전트의 공개 디스커버리 허브입니다. A2A
              REST·Agent Card·x402/MPP 결제 URL을 한곳에서 제공하고, 빌더는 Studio 플랫폼에서
              완성합니다.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={studioUrl}
                className="inline-flex items-center gap-2 rounded-lg bg-google-blue px-5 py-3 text-sm font-semibold text-white"
              >
                <Sparkles className="h-4 w-4" />
                3분 만에 AI 에이전트 배포하기
              </a>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 rounded-lg border border-solana-green/40 bg-solana-green/10 px-5 py-3 text-sm font-semibold text-solana-green"
              >
                라이브 에이전트 둘러보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-2">
              {[
                'GCP Vertex AI Vector Search',
                'Solana x402 / MPP',
                'A2A REST API',
                'Cloud Run Serverless',
              ].map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-outline-variant/40 bg-surface-container-lowest/80 px-3 py-1.5 text-[11px] font-medium text-on-surface-variant"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        </header>

        {/* Architecture */}
        <section className="mb-20">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-outline">
            System architecture
          </p>
          <h3 className="mb-3 text-2xl font-bold md:text-3xl">엔드투엔드 파이프라인 아키텍처</h3>
          <p className="mb-8 max-w-2xl text-sm text-on-surface-variant md:text-base">
            Studio에서 문서 수집·배포가 끝나면, Catalog가 공개 목록과 결제 가능 invoke URL을
            노출합니다. 호출은 x402/MPP로 정산됩니다.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ArchCard
              step="Step 1"
              title="Ingestion"
              subtitle="Google Drive & Docs"
              body="사내 문서·규칙을 Studio가 Vertex AI Vector RAG로 인덱싱합니다."
              tag="GCP Vertex Vector DB"
            />
            <ArchCard
              step="Step 2"
              title="Publish"
              subtitle="SolVamos Catalog"
              body="에이전트 생성 시 Catalog 저장소에 등록되고 /a/:id 공개 페이지가 열립니다."
              tag="Source of truth"
            />
            <ArchCard
              step="Step 3"
              title="402 Auth"
              subtitle="x402 / MPP Gateway"
              body="HTTP 402 Payment Required 시 pay fetch가 USDC 결제를 처리합니다."
              tag="Solana Devnet / Localnet"
            />
            <ArchCard
              step="Step 4"
              title="A2A Delivery"
              subtitle="REST · Agent Card"
              body="외부 에이전트가 Catalog JSON·Markdown·invoke URL로 바로 연동합니다."
              tag="OpenAPI / JSON REST"
            />
          </div>
        </section>

        {/* 3-step workflow */}
        <section className="mb-20">
          <h3 className="mb-3 text-2xl font-bold md:text-3xl">
            3단계로 끝나는 AI 에이전트 수익화 워크플로우
          </h3>
          <p className="mb-8 max-w-2xl text-sm text-on-surface-variant">
            개발자 없이도 Drive 연결부터 공개 카탈로그 게시·온체인 정산까지 이어집니다.
          </p>
          <div className="space-y-4">
            <WorkflowRow
              num="01"
              label="Vertex AI RAG"
              title="Google Drive 문서 연동"
              body="Studio에서 Drive·로컬 문서를 지정하면 Vertex AI가 임베딩·인덱싱을 수행합니다."
            />
            <WorkflowRow
              num="02"
              label="x402 / MPP"
              title="호출 단가 및 수신 지갑 설정"
              body="쿼리당 USDC 단가와 에이전트 vault를 설정하면 게이트웨이가 402 결제를 맡습니다."
            />
            <WorkflowRow
              num="03"
              label="Catalog"
              title="공개 카탈로그 게시 & REST 연동"
              body="게시 즉시 Marketplace와 /api/catalog·/api/solvamos/:id 가 갱신되어 A2A 호출이 가능합니다."
            />
          </div>
          <div className="mt-8">
            <a
              href={studioUrl}
              className="inline-flex items-center gap-2 rounded-lg bg-google-blue px-5 py-3 text-sm font-semibold text-white"
            >
              Studio 플랫폼에서 시작하기 <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Value props */}
        <section className="mb-20 grid gap-8 md:grid-cols-3">
          <Value
            icon={<Cloud className="h-5 w-5 text-google-blue" />}
            title="서버리스 완전 관리형 Infra"
            body="Cloud Run·Vertex 기반으로 트래픽에 맞춰 확장합니다. Catalog는 디스커버리 전용 서비스입니다."
          />
          <Value
            icon={<Wallet className="h-5 w-5 text-solana-green" />}
            title="실시간 Solana 온체인 정산"
            body="x402/MPP로 PG 없이 USDC 마이크로 결제가 vault로 정산됩니다."
          />
          <Value
            icon={<Link2 className="h-5 w-5 text-primary" />}
            title="A2A REST API 호환"
            body="외부 에이전트는 Catalog API만으로 가격·invoke URL·Agent Card를 가져갈 수 있습니다."
          />
        </section>

        {/* Live catalog strip */}
        <section className="glass-panel rounded-xl p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-solana-green">
                Live catalog
              </p>
              <p className="mt-2 text-2xl font-semibold md:text-3xl">
                {catalog
                  ? `${catalog.agent_count} agents · ${catalog.paid_count} paid`
                  : 'Catalog loading…'}
              </p>
              <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
                공개 디스커버리 원본은 이 Catalog 서비스입니다. Studio는 에이전트를 등록하고,
                목록은 여기서 읽어 표시합니다.
              </p>
              <p className="mt-3 break-all font-mono text-xs text-outline">
                {(catalog?.base_url || window.location.origin) + '/api/catalog'}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-surface-container-high px-4 py-2.5 text-sm font-semibold hover:bg-surface-container-highest"
              >
                <Boxes className="h-4 w-4" /> 디렉토리 보기
              </Link>
              <a
                href={studioUrl}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-google-blue px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Cpu className="h-4 w-4" /> Studio 플랫폼
              </a>
            </div>
          </div>
        </section>

        <footer className="mt-16 flex flex-col gap-3 border-t border-outline-variant/20 pt-8 text-sm text-outline md:flex-row md:items-center md:justify-between">
          <p className="inline-flex items-center gap-2">
            <Shield className="h-4 w-4 text-solana-green" />
            Discovery on Catalog · Build on Studio · Settle with x402/MPP
          </p>
          <a href={studioUrl} className="font-semibold text-google-blue hover:underline">
            {studioUrl.replace(/^https?:\/\//, '')} →
          </a>
        </footer>
      </div>
    </div>
  );
}

function ArchCard({
  step,
  title,
  subtitle,
  body,
  tag,
}: {
  step: string;
  title: string;
  subtitle: string;
  body: string;
  tag: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-surface-container-lowest/60 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-outline">
        {step}: {title}
      </p>
      <h4 className="mt-2 text-lg font-semibold">{subtitle}</h4>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{body}</p>
      <p className="mt-4 font-mono text-[11px] text-solana-green">{tag}</p>
    </div>
  );
}

function WorkflowRow({
  num,
  label,
  title,
  body,
}: {
  num: string;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-white/10 bg-surface-container-lowest/40 p-5 md:gap-6">
      <div className="shrink-0 font-mono text-2xl font-bold text-primary">{num}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-outline">{label}</p>
        <h4 className="mt-1 text-lg font-semibold">{title}</h4>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{body}</p>
      </div>
    </div>
  );
}

function Value({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="mb-3 inline-flex rounded-lg bg-surface-container-high p-2.5">{icon}</div>
      <h4 className="mb-2 text-lg font-semibold">{title}</h4>
      <p className="text-sm leading-relaxed text-on-surface-variant">{body}</p>
    </div>
  );
}
