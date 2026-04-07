"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

const PACKAGE_MANAGERS: PackageManager[] = ["npm", "yarn", "pnpm", "bun"];
const PACKAGE_MANAGER_STORAGE_KEY = "tokun-docs-package-manager";
const PACKAGE_MANAGER_EVENT = "tokun-docs-package-manager-change";

function isPackageManager(value: string | null): value is PackageManager {
  return value !== null && PACKAGE_MANAGERS.includes(value as PackageManager);
}

interface PackageManagerTabsProps {
  npm: string;
  yarn: string;
  pnpm: string;
  bun: string;
  className?: string;
}

export function PackageManagerTabs({
  npm,
  yarn,
  pnpm,
  bun,
  className,
}: PackageManagerTabsProps) {
  const [activeManager, setActiveManager] =
    React.useState<PackageManager | null>(null);

  const commands: Record<PackageManager, string> = {
    npm,
    yarn,
    pnpm,
    bun,
  };

  React.useEffect(() => {
    const savedManager = window.localStorage.getItem(
      PACKAGE_MANAGER_STORAGE_KEY,
    );

    if (isPackageManager(savedManager)) {
      setActiveManager(savedManager);
      return;
    }

    setActiveManager("npm");
  }, []);

  React.useEffect(() => {
    const syncManager = (value: string | null) => {
      if (isPackageManager(value)) {
        setActiveManager(value);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== PACKAGE_MANAGER_STORAGE_KEY) {
        return;
      }

      syncManager(event.newValue);
    };

    const handleManagerChange = (event: Event) => {
      syncManager((event as CustomEvent<PackageManager>).detail);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(PACKAGE_MANAGER_EVENT, handleManagerChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PACKAGE_MANAGER_EVENT, handleManagerChange);
    };
  }, []);

  const updateManager = (manager: PackageManager) => {
    setActiveManager(manager);
    window.localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, manager);
    window.dispatchEvent(
      new CustomEvent<PackageManager>(PACKAGE_MANAGER_EVENT, {
        detail: manager,
      }),
    );
  };

  return (
    <div
      className={cn(
        "not-prose my-4 overflow-hidden rounded-lg border",
        className,
      )}
    >
      <div className="bg-muted/40 flex flex-wrap gap-1 border-b p-1">
        {PACKAGE_MANAGERS.map((manager) => (
          <button
            type="button"
            key={manager}
            onClick={() => updateManager(manager)}
            className={cn(
              "focus-visible:ring-ring rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1",
              activeManager === manager
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
            )}
          >
            {manager}
          </button>
        ))}
      </div>

      <pre className="m-0 overflow-x-auto rounded-none bg-transparent px-4 py-3 text-sm">
        <code>{activeManager === null ? " " : commands[activeManager]}</code>
      </pre>
    </div>
  );
}
