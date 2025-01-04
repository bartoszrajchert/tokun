import GrainyBg from "@/components/grainy-bg";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-[calc(100vh-80px)] w-full">
      <div className="flex h-[calc(100vh-80px)] flex-col items-end justify-between py-8 md:py-24">
        <div className="flex w-full justify-between gap-6 text-white">
          <img
            src="/emblem.svg"
            alt="Tokun Emblem"
            className="h-[100px] w-[100px] md:h-[160px] md:w-[160px] lg:h-[240px] lg:w-[240px]"
          />
          <p className="hidden sm:block">— now in experimental phase.</p>
        </div>
        <div className="flex w-full flex-col justify-between lg:flex-row lg:items-end">
          <ul className="mb-2 flex flex-wrap justify-end gap-2 text-[14px] text-white sm:gap-4 lg:block lg:text-base">
            <li>DTCG Format</li>
            <li>Figma Variables</li>
            <li>CSS Variables</li>
          </ul>
          <div className="flex flex-col items-end gap-4 sm:gap-8">
            <h1
              id="main-text"
              className="text-right text-[32px] leading-[1.2] text-white sm:text-[50px] md:w-[600px] xl:w-[730px] xl:text-[60px]"
            >
              Working on the ultimate tools for
              <span className="fancy"> design tokens</span>
            </h1>
            <div className="space-x-2">
              <Link href="/docs">
                <Button variant="outline">What is Tokun?</Button>
              </Link>
              <Link href="/playground">
                <Button>Give it a try</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <GrainyBg />
    </div>
  );
}
