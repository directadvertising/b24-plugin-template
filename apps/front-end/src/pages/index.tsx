import { useB24FrameOrNull, useB24Init } from "@common/b24ui-react";
import {
  Code,
  Database,
  Lock,
  Rocket,
  TableProperties,
  Widgets,
} from "lucide-react";
import { useEffect, useRef } from "react";
import BackendStatus from "../components/BackendStatus";
import FeatureCard from "../components/FeatureCard";

export default function IndexPage() {
  const { initApp, isInitialized, isLoading, error, logger } = useB24Init({
    loggerTitle: "IndexPage",
    onLocaleDetected: (lang) => {
      logger.log("Detected locale:", lang);
    },
  });

  const frame = useB24FrameOrNull();
  const initCalled = useRef(false);

  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;

    initApp()
      .then(($b24) => {
        $b24.parent.setTitle("Starter");
      })
      .catch((err) => {
        logger.error("Init failed:", err);
      });
  }, [initApp, logger]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">Initialization Error</p>
          <p className="mt-1 text-sm text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-[oklch(0.6_0.118_184.704)] px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight">
            Bitrix24 Starter Kit
          </h1>
          <p className="mt-3 text-lg font-light opacity-90">
            A production-ready template for building Bitrix24 applications
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["React 19", "Express 5", "TypeScript"].map((label) => (
              <span
                key={label}
                className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Status Dashboard */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">B24 Connection</h3>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  frame
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-gray-200 bg-gray-50 text-gray-600"
                }`}
              >
                {frame ? "Connected" : "Disconnected"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Portal language: {frame?.getLang() ?? "unknown"}
            </p>
          </div>
          <BackendStatus />
        </div>

        {/* Features */}
        <h2 className="mb-4 text-xl font-semibold">What's Inside</h2>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Rocket className="size-5" />}
            title="React + Vite"
            description="Fast HMR, React 19 with compiler, and Tailwind CSS 4 out of the box."
            badge="Frontend"
          />
          <FeatureCard
            icon={<Database className="size-5" />}
            title="Express + Kysely"
            description="Type-safe backend with contract middleware and Kysely query builder."
            badge="Backend"
          />
          <FeatureCard
            icon={<Lock className="size-5" />}
            title="OAuth 2.0"
            description="Simplified Bitrix24 OAuth flow with JWT session management."
            badge="Auth"
          />
          <FeatureCard
            icon={<Widgets className="size-5" />}
            title="CRM Widgets"
            description="Pre-configured deal tab and custom field placements ready to use."
            badge="Widgets"
          />
          <FeatureCard
            icon={<TableProperties className="size-5" />}
            title="PostgreSQL"
            description="Database with Kysely migrations and typed schema definitions."
            badge="Database"
          />
          <FeatureCard
            icon={<Code className="size-5" />}
            title="Type-safe Contracts"
            description="Shared API contracts with Zod validation between frontend and backend."
            badge="DX"
          />
        </div>

        {/* Footer */}
        <div className="border-t pt-4">
          <div className="flex justify-center gap-6 text-sm">
            <a
              href="https://apidocs.bitrix24.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              REST API Docs
            </a>
            <a
              href="https://github.com/bitrix24/b24jssdk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              JS SDK
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
