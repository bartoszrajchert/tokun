"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

export default function GrainyBg() {
  const gradientDivRef = useRef<HTMLDivElement>(null);
  const grainDivRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.to(gradientDivRef.current, {
        duration: 4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        yoyoEase: "sine.inOut",
        "--g1-x": "72%",
        "--g1-y": "23%",
        "--g2-x": "60%",
        "--g2-y": "50%",
        "--g3-x": "20%",
        "--g3-y": "70%",
        "--g4-x": "0%",
        "--g4-y": "8%",
      });

      const moveGradient = (event: MouseEvent) => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        const mouseX = Math.round((event.pageX / width) * 100);
        const mouseY = Math.round((event.pageY / height) * 100);

        gsap.to(gradientDivRef.current, {
          duration: 0.5,
          ease: "sine",
          "--i-blob-x": `${(mouseX / 100) * 72 + 72}%`,
          "--i-blob-y": `${(mouseY / 100) * 76 + 76}%`,
        });
      };

      const adjustHeight = () => {
        gsap.set(grainDivRef.current, {
          height: `${document.body.scrollHeight + 10}px`,
        });
        gsap.set(gradientDivRef.current, {
          height: `${document.body.scrollHeight + 10}px`,
        });
      };

      window.addEventListener("resize", adjustHeight);
      document.addEventListener("mousemove", moveGradient);

      return () => {
        window.addEventListener("resize", adjustHeight);
        document.removeEventListener("mousemove", moveGradient);
      };
    },
    { dependencies: [gradientDivRef], scope: gradientDivRef },
  );

  return (
    <div className="fancy-bg">
      <div className="grain" ref={grainDivRef}></div>
      <div className="gradient-bg" ref={gradientDivRef}></div>
    </div>
  );
}
