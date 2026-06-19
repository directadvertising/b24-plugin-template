import type { B24Frame } from "@bitrix24/b24jssdk";
import { initializeB24Frame, LoggerBrowser } from "@bitrix24/b24jssdk";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "@/lib/i18n";
import type { TranslationKey } from "@/types/localization";

/** Handed to every step's `action` — the frame plus UI controls. */
export interface InstallStepContext<TStore extends object> {
  /** The initialized Bitrix24 frame. */
  $b24: B24Frame;
  /** Per-run bag for passing data between steps (e.g. `init` → `serverSide`). */
  store: TStore;
  /** Set the progress bar (0–100), or `null` for the indeterminate look. */
  setProgress: (value: number | null) => void;
  /** Switch the progress bar / checkmark color. */
  setProgressColor: (color: "blue" | "green") => void;
  /** Scoped logger. */
  logger: LoggerBrowser;
}

export interface InstallStep<TStore extends object> {
  /** Caption shown under the title while this step runs. */
  caption: TranslationKey;
  /** The work to perform. Throw to abort the install and surface the message. */
  action: (ctx: InstallStepContext<TStore>) => Promise<void>;
}

export interface InstallPageConfig<TStore extends object> {
  /** Page heading. */
  title: TranslationKey;
  /** Caption shown before the first step / on an unknown state. */
  fallbackCaption: TranslationKey;
  /** Message shown if `initializeB24Frame()` fails. */
  initErrorCaption: TranslationKey;
  /** Ordered steps — they run top-to-bottom; the first throw aborts. */
  steps: InstallStep<TStore>[];
  /** Title set on the parent (portal) window. Defaults to `"Install"`. */
  frameTitle?: string;
  /** Logger channel name. Defaults to `"Install"`. */
  loggerName?: string;
  /** Build the per-run shared store. Defaults to `{}`. */
  createStore?: () => TStore;
}

/**
 * Build an install page from an ordered list of steps. The returned component
 * owns the whole install machine — frame init, locale, the step loop, progress,
 * and error handling — so a feature only declares *what* its steps do.
 *
 * ```ts
 * export const InstallPage = createInstallPage<{ init?: InitData }>({
 *   title: "install.title",
 *   fallbackCaption: "install.steps.fallback",
 *   initErrorCaption: "install.failedInit",
 *   steps: [
 *     { caption: "install.steps.init", action: async ({ $b24, store }) => { ... } },
 *   ],
 * });
 * ```
 */
export function createInstallPage<
  TStore extends object = Record<string, unknown>,
>(config: InstallPageConfig<TStore>) {
  const {
    title,
    fallbackCaption,
    initErrorCaption,
    steps,
    frameTitle = "Install",
    loggerName = "Install",
    createStore,
  } = config;

  return function InstallPage() {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState<number | null>(null);
    const [progressColor, setProgressColor] = useState<"blue" | "green">(
      "blue",
    );
    const [error, setError] = useState<string | null>(null);
    const initCalled = useRef(false);

    const logger = useRef(
      LoggerBrowser.build(loggerName, import.meta.env.DEV),
    ).current;

    useEffect(() => {
      if (initCalled.current) return;
      initCalled.current = true;

      runInstall();
    });

    async function runInstall() {
      let $b24: B24Frame;

      try {
        $b24 = await initializeB24Frame();
        await setAppLanguage($b24.getLang());
      } catch (err) {
        logger.error(err);
        setError(t(initErrorCaption));
        return;
      }

      const ctx: InstallStepContext<TStore> = {
        $b24,
        store: createStore ? createStore() : ({} as TStore),
        setProgress,
        setProgressColor,
        logger,
      };

      try {
        await $b24.parent.setTitle(frameTitle);

        for (let i = 0; i < steps.length; i++) {
          setCurrentStep(i);
          logger.info(`Step: ${steps[i].caption}`);
          await steps[i].action(ctx);
        }
      } catch (err: unknown) {
        logger.error(err);
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    const caption = steps[currentStep]?.caption ?? fallbackCaption;
    const isDone = progressColor === "green";

    return (
      <div className="mx-3 flex flex-col items-center justify-center gap-1 h-dvh">
        <div className="size-[208px] flex items-center justify-center">
          <svg
            className={`size-32 ${isDone ? "text-green-500" : "text-green-300"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            role="img"
            aria-label="Installation progress"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        </div>

        <div className="w-1/2 sm:w-1/3 h-1 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isDone ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: progress != null ? `${progress}%` : "60%" }}
          />
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-900 text-nowrap">
            {t(title)}
          </h1>
          <p className="text-sm text-gray-500">{t(caption)}</p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 max-w-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  };
}
