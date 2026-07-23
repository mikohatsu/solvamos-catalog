import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Boxes, Sparkles, Wallet } from 'lucide-react';
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

  const studioUrl = catalog?.studio_url || 'http://localhost:3000';

  return (
    <div className="mesh min-h-screen text-on-surface">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-8 md:px-10 md:pt-12">
        <SiteHeader studioUrl={studioUrl} />

        <header className="relative mb-16 overflow-hidden rounded-2xl border border-white/10 px-6 py-14 md:px-14 md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(66,133,244,0.24),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(20,241,149,0.14),transparent_50%)]" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative"
          >
            <div className="mb-7 flex items-center gap-4">
              <img
                src="/logo.png"
                alt="SolVamos"
                className="h-16 w-16 object-contain md:h-20 md:w-20"
              />
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary md:text-6xl">
                  SolVamos
                </h1>
                <p className="mt-1 text-sm font-medium uppercase tracking-[0.32em] text-on-surface md:text-base">
                  Agent Marketplace
                </p>
              </div>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-on-surface-variant md:text-lg">
              공개 에이전트 디렉토리와 x402/MPP 결제 호출을 한곳에서. 에이전트가 게시되면
              카탈로그 JSON과 전용 웹페이지가 함께 생깁니다.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 rounded-lg bg-google-blue px-5 py-2.5 text-sm font-semibold text-white"
              >
                <Boxes className="h-4 w-4" /> 마켓플레이스 열기
              </Link>
              <a
                href={studioUrl}
                className="inline-flex items-center gap-2 rounded-lg border border-solana-green/40 bg-solana-green/10 px-5 py-2.5 text-sm font-semibold text-solana-green"
              >
                Studio에서 게시 <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="mb-14 grid gap-6 md:grid-cols-3"
        >
          <Feature
            icon={<Sparkles className="h-5 w-5 text-primary" />}
            title="에이전트마다 공개 페이지"
            body="pay.sh/api/birdeye/data 처럼 /a/:agentId 페이지와 /api/solvamos/:agentId JSON이 자동으로 열립니다."
          />
          <Feature
            icon={<Boxes className="h-5 w-5 text-google-blue" />}
            title="카탈로그에서 긁어 표시"
            body="외부 랜딩/마켓은 /api/catalog 한 번으로 목록·가격·invoke URL·page_url을 가져옵니다."
          />
          <Feature
            icon={<Wallet className="h-5 w-5 text-solana-green" />}
            title="x402 / MPP 결제"
            body="유료 호출은 pay fetch가 HTTP 402를 처리합니다. 디스커버리와 결제가 분리됩니다."
          />
        </motion.section>

        {catalog && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel rounded-xl p-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-solana-green">
                  Live catalog
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {catalog.agent_count} agents · {catalog.paid_count} paid
                </p>
                <p className="mt-1 font-mono text-xs text-outline break-all">
                  {catalog.base_url}/api/catalog
                </p>
              </div>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 self-start rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold hover:bg-surface-container-highest"
              >
                디렉토리 보기 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}

function Feature({
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
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <p className="text-sm leading-relaxed text-on-surface-variant">{body}</p>
    </div>
  );
}
