"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

export default function ManifestoSection() {
	const sectionRef = useRef<HTMLElement>(null);
	const wordsRef = useRef<HTMLDivElement>(null);
	const ctaRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const ctx = gsap.context(() => {
			const bg = sectionRef.current?.querySelector(".manifesto-bg");
			if (bg) {
				gsap.to(bg, {
					y: -80,
					ease: "none",
					scrollTrigger: {
						trigger: sectionRef.current,
						start: "top bottom",
						end: "bottom top",
						scrub: true,
					},
				});
			}

			const words = wordsRef.current?.querySelectorAll(".word-reveal");
			if (words) {
				gsap.from(words, {
					y: 30,
					opacity: 0,
					duration: 0.6,
					ease: "power3.out",
					stagger: 0.07,
					scrollTrigger: {
						trigger: wordsRef.current,
						start: "top 80%",
					},
				});
			}

			if (ctaRef.current) {
				gsap.from(ctaRef.current, {
					y: 30,
					opacity: 0,
					duration: 0.8,
					ease: "power3.out",
					scrollTrigger: {
						trigger: ctaRef.current,
						start: "top 90%",
					},
				});
			}
		});

		return () => ctx.revert();
	}, []);

	return (
		<section
			ref={sectionRef}
			className="relative z-10 bg-void pt-16 md:pt-24 pb-32 md:pb-48 overflow-hidden"
		>
			{/* Top fade from hero */}
			<div
				className="absolute top-0 left-0 right-0 h-40 md:h-56 pointer-events-none z-[1]"
				style={{
					background:
						"linear-gradient(to bottom, var(--void) 10%, transparent 100%)",
				}}
			/>

			{/* Bottom fade — stay on void so footer curve reads clearly */}
			<div
				className="absolute bottom-0 left-0 right-0 h-48 md:h-64 pointer-events-none z-[1]"
				style={{
					background:
						"linear-gradient(to bottom, transparent 0%, var(--void) 100%)",
				}}
			/>

			{/* Parallax background image */}
			<div className="manifesto-bg absolute inset-0 opacity-[0.1] pointer-events-none overflow-hidden">
				<Image
					src="/images/clean_room.png"
					alt="Pharmaceutical clean room corridor"
					fill
					className="object-fill scale-[1.35]"
					priority={false}
				/>
				<div
					className="absolute inset-0 opacity-[0.2] mix-blend-overlay"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
					}}
				/>
			</div>

			<div className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-16 text-center py-8 md:py-16">
				{/* Large manifesto text */}
				<div ref={wordsRef}>
					<div className="flex flex-wrap justify-center items-baseline gap-x-4 md:gap-x-6">
						{"We focus on the".split(" ").map((word, i) => (
							<span
								key={i}
								className="word-reveal font-instrument text-[48px] md:text-[80px] lg:text-[110px] italic text-text-primary leading-[1.1]"
							>
								{word}
							</span>
						))}
					</div>
					<div className="mt-2">
						<span className="word-reveal inline-block font-instrument text-[56px] md:text-[96px] lg:text-[120px] italic text-teal leading-[1.1]">
							moment.
						</span>
					</div>
				</div>

				{/* CTA */}
				<div ref={ctaRef} className="mt-12 md:mt-16">
					<p className="font-lora text-[16px] md:text-[18px] text-text-secondary leading-relaxed max-w-[480px] mx-auto mb-8">
						Ready when you are. No pills, no planning, no waiting.
					</p>
					<a
						href="https://intake.aspargolabs.com"
						target="_blank"
						rel="noopener noreferrer"
						className="btn-primary text-[15px] md:text-[16px] py-4 px-10 shadow-xl shadow-teal/10"
					>
						<span className="btn-fill" />
						<span className="relative z-10">Buy Now</span>
					</a>
				</div>
			</div>
		</section>
	);
}
