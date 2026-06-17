"use client";

import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useLayoutEffect,
	type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { X, ChevronDown, Plus, Minus } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AttributionCtaLink } from "@/app/components/AttributionCtaLink";
import { openLandingCta } from "@/lib/attribution/cta";
import { loadInboundAttribution } from "@/lib/attribution/inbound-params";

gsap.registerPlugin(ScrollTrigger);

const qaData = [
	{
		question: "How fast does it start working?",
		answer: "HEZKUE® achieves detectable plasma sildenafil concentrations within 5 minutes of application. In a 56-subject crossover study, the comparator tablet showed zero measurable absorption at the same timepoint. Most users report noticeable effects within 5 to 10 minutes.",
	},
	{
		question: "Can I use it even if I've drunk or eaten recently?",
		answer: "Yes. Because HEZKUE® is absorbed through the buccal mucosa (inside the mouth), it bypasses the GI tract entirely. A high-fat meal that would delay a tablet by over an hour has no meaningful effect on spray absorption or onset time.",
	},
	{
		question: "How long does it work for?",
		answer: "HEZKUE® provides the same duration of action as standard sildenafil tablets, typically 4 to 6 hours. Total drug exposure (AUC) is bioequivalent to the reference tablet, so the therapeutic window is unchanged.",
	},
	{
		question: "Is it safe to use?",
		answer: "HEZKUE® contains the same active ingredient (sildenafil citrate) used in over 30 years of clinical practice. The spray formulation was evaluated in a full pharmacokinetic study with 56 healthy volunteers. Safety and tolerability profiles are consistent with established sildenafil data.",
	},
	{
		question: "How do I use this spray?",
		answer: "Shake gently, point the nozzle toward the inside of your cheek, and press the pump. Each actuation delivers a precisely calibrated dose. Hold for a few seconds before swallowing. The mint-flavoured suspension provides immediate sensory feedback.",
	},
	{
		question: "Is it better than Cialis or Viagra?",
		answer: "HEZKUE® delivers sildenafil, the same active ingredient as Viagra, but via a faster-absorbing oral spray. Compared to Cialis (tadalafil), HEZKUE® offers a different mechanism with rapid onset rather than a longer duration window. The best choice depends on your lifestyle and physician guidance.",
	},
];

const HERO_VIDEO_LANDSCAPE = "/output_landscape.webm";
const HERO_VIDEO_PORTRAIT = "/output_portrait.webm";
const VIDEO_Z_INDEX = 10;
const CARD_COUNT = qaData.length;
const ANGLE_STEP = 360 / CARD_COUNT;

const TRANSITION_EASE = "power3.inOut";
const TRANSITION_DURATION = 0.9;
const PANEL_SLIDE = 56;

const VIDEO_VIGNETTE_MASK = {
	portrait:
		"radial-gradient(ellipse 78% 74% at 50% 50%, #000 32%, rgba(0,0,0,0.65) 58%, transparent 82%)",
	landscape:
		"radial-gradient(ellipse 72% 68% at 50% 50%, #000 38%, rgba(0,0,0,0.55) 60%, transparent 80%)",
} as const;

const VIDEO_VIGNETTE_OVERLAY = {
	portrait:
		"radial-gradient(ellipse 88% 84% at 50% 50%, transparent 38%, var(--void) 100%)",
	landscape:
		"radial-gradient(ellipse 80% 76% at 50% 50%, transparent 44%, var(--void) 100%)",
} as const;

function VideoVignette({
	children,
	className = "",
	variant = "landscape",
}: {
	children: ReactNode;
	className?: string;
	variant?: keyof typeof VIDEO_VIGNETTE_MASK;
}) {
	const mask = VIDEO_VIGNETTE_MASK[variant];
	const overlay = VIDEO_VIGNETTE_OVERLAY[variant];

	return (
		<div
			className={`relative overflow-hidden ${className}`}
			style={{
				maskImage: mask,
				WebkitMaskImage: mask,
			}}
		>
			{children}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{ background: overlay }}
			/>
		</div>
	);
}

function HeroVideo({
	src,
	className = "",
	fit = "contain",
}: {
	src: string;
	className?: string;
	fit?: "contain" | "cover";
}) {
	const fitClass = fit === "cover" ? "object-cover" : "object-contain";
	return (
		<video
			autoPlay
			muted
			loop
			playsInline
			preload="auto"
			className={`w-full h-full bg-transparent pointer-events-none ${fitClass} ${className}`}
			style={{ backgroundColor: "transparent" }}
		>
			<source src={src} type='video/webm; codecs="vp9"' />
		</video>
	);
}

function OrbitCard({
	question,
	onClick,
}: {
	question: string;
	onClick: () => void;
}) {
	return (
		<button onClick={onClick} className="w-full text-center group">
			<div className="relative overflow-hidden rounded-xl px-6 py-5 backdrop-blur-xl bg-[rgba(6,8,16,0.55)] border border-[rgba(13,183,187,0.22)] transition-all duration-500 group-hover:border-[rgba(13,183,187,0.6)] group-hover:bg-[rgba(6,8,16,0.7)] group-hover:shadow-[0_0_32px_rgba(13,183,187,0.2),0_0_80px_rgba(13,183,187,0.06)] group-hover:scale-[1.04]">
				{/* Top-left corner accent */}
				<div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
					<div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-teal/60 to-transparent" />
					<div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-teal/60 to-transparent" />
				</div>
				{/* Bottom-right corner accent */}
				<div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none">
					<div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-teal/40 to-transparent" />
					<div className="absolute bottom-0 right-0 h-full w-px bg-gradient-to-t from-teal/40 to-transparent" />
				</div>
				{/* Inner glow on hover */}
				<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,rgba(13,183,187,0.1)_0%,transparent_70%)]" />

				<p className="relative z-10 font-dm text-[15px] text-text-primary/90 leading-snug text-center group-hover:text-text-primary transition-colors duration-300">
					{question}
				</p>
			</div>
		</button>
	);
}

function LearnMoreLink({ className = "" }: { className?: string }) {
	return (
		<AttributionCtaLink
			placement="hero"
			className={`btn-primary inline-flex text-[13px] py-2.5 px-6 ${className}`}
		>
			<span className="btn-fill" />
			<span className="relative z-10">Learn More</span>
		</AttributionCtaLink>
	);
}

function MobileFaqCard({
	question,
	answer,
	isActive,
	onSelect,
	index,
}: {
	question: string;
	answer: string;
	isActive: boolean;
	onSelect: () => void;
	index: number;
}) {
	const cardRef = useRef<HTMLButtonElement>(null);
	const answerRef = useRef<HTMLDivElement>(null);
	const accentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!answerRef.current || !accentRef.current) return;
		if (isActive) {
			gsap.to(answerRef.current, {
				height: "auto",
				opacity: 1,
				duration: 0.5,
				ease: "power3.out",
			});
			gsap.to(accentRef.current, {
				scaleY: 1,
				opacity: 1,
				duration: 0.45,
				ease: "power3.out",
			});
		} else {
			gsap.to(answerRef.current, {
				height: 0,
				opacity: 0,
				duration: 0.32,
				ease: "power2.inOut",
			});
			gsap.to(accentRef.current, {
				scaleY: 0.3,
				opacity: 0.35,
				duration: 0.3,
				ease: "power2.inOut",
			});
		}
	}, [isActive]);

	return (
		<div
			className={`mobile-faq-card relative w-full text-left group transition-all duration-500 ${
				isActive ? "scale-[1.02] z-10" : "hover:opacity-100"
			}`}
			style={{ marginLeft: index % 2 === 1 ? 12 : 0 }}
		>
			<div
				className={`relative overflow-hidden rounded-2xl px-5 py-5 backdrop-blur-xl border transition-all duration-500 ${
					isActive
						? "bg-[rgba(6,8,16,0.75)] border-[rgba(13,183,187,0.45)] shadow-[0_0_40px_rgba(13,183,187,0.12),inset_0_1px_0_rgba(13,183,187,0.15)]"
						: "bg-[rgba(6,8,16,0.65)] border-[rgba(13,183,187,0.22)] hover:border-[rgba(13,183,187,0.35)]"
				}`}
			>
				<div
					ref={accentRef}
					className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-teal origin-top"
					style={{ transform: "scaleY(0.3)", opacity: 0.35 }}
				/>

				<button
					type="button"
					ref={cardRef}
					onClick={onSelect}
					className="flex w-full items-start gap-4 pl-3 text-left"
				>
					<div className="flex-1 min-w-0">
						<p
							className={`font-dm text-[16px] leading-snug transition-colors duration-300 ${
								isActive
									? "text-text-primary"
									: "text-text-primary/85"
							}`}
						>
							{question}
						</p>
					</div>
					<div
						className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
							isActive
								? "border-teal/50 bg-teal/15 text-teal"
								: "border-[rgba(13,183,187,0.2)] text-teal/60 group-hover:border-teal/35"
						}`}
					>
						{isActive ? <Minus size={14} /> : <Plus size={14} />}
					</div>
				</button>

				<div
					ref={answerRef}
					className="overflow-hidden h-0 opacity-0 pl-3"
				>
					<div className="w-8 h-px bg-teal/40 my-4" />
					<p className="font-lora text-[14px] text-text-secondary leading-[1.8] pr-1">
						{answer}
					</p>
					<LearnMoreLink className="mt-5" />
				</div>

				{isActive && (
					<div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_0%_50%,rgba(13,183,187,0.08)_0%,transparent_60%)]" />
				)}
			</div>
		</div>
	);
}

function HeroFaq({
	activeIndex,
	onSelect,
}: {
	activeIndex: number | null;
	onSelect: (index: number) => void;
}) {
	const sectionRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const section = sectionRef.current;
		if (!section) return;

		const cards = section.querySelectorAll(".mobile-faq-card");
		if (!cards.length) return;

		gsap.set(cards, { opacity: 1, y: 0 });

		const ctx = gsap.context(() => {
			gsap.from(cards, {
				y: 28,
				duration: 0.65,
				ease: "power3.out",
				stagger: 0.08,
				scrollTrigger: {
					trigger: section,
					start: "top 92%",
					once: true,
				},
			});
		}, section);

		requestAnimationFrame(() => ScrollTrigger.refresh());

		return () => ctx.revert();
	}, []);

	return (
		<section
			ref={sectionRef}
			id="hero-faq"
			className="relative z-10 bg-void overflow-hidden scroll-mt-20"
		>
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute inset-0 opacity-40 grid-overlay" />
				<div className="teal-glow top-0 left-1/2 -translate-x-1/2 opacity-[0.05]" />
				<div
					className="absolute top-0 left-0 right-0 h-40"
					style={{
						background:
							"linear-gradient(to bottom, var(--void) 0%, transparent 100%)",
					}}
				/>
				<div
					className="absolute bottom-0 left-0 right-0 h-48"
					style={{
						background:
							"linear-gradient(to bottom, transparent 0%, var(--void) 92%)",
					}}
				/>
			</div>

			<div className="relative z-10 px-5 md:px-16 pt-12 md:pt-20 pb-28 md:pb-32 max-w-[540px] md:max-w-[720px] mx-auto">
				<div className="space-y-3">
					{qaData.map((qa, i) => (
						<MobileFaqCard
							key={i}
							index={i}
							question={qa.question}
							answer={qa.answer}
							isActive={activeIndex === i}
							onSelect={() => onSelect(i)}
						/>
					))}
				</div>
			</div>
		</section>
	);
}

export default function HeroSection() {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [faqIndex, setFaqIndex] = useState<number | null>(null);
	const sectionRef = useRef<HTMLElement>(null);
	const videoSideRef = useRef<HTMLDivElement>(null);
	const cardsLayerRef = useRef<HTMLDivElement>(null);
	const answerPanelRef = useRef<HTMLDivElement>(null);
	const answerContentRef = useRef<HTMLDivElement>(null);
	const questionsRef = useRef<HTMLDivElement>(null);
	const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
	const orbitProxy = useRef({ angle: 0 });
	const orbitTweenRef = useRef<gsap.core.Tween | null>(null);
	const transitionRef = useRef<gsap.core.Timeline | null>(null);
	const isAnimating = useRef(false);
	const isPaused = useRef(false);

	const killTransition = useCallback(() => {
		transitionRef.current?.kill();
		transitionRef.current = null;
	}, []);

	const updatePositions = useCallback(() => {
		const containerEl = questionsRef.current;
		if (!containerEl) return;
		const { clientWidth: cw, clientHeight: ch } = containerEl;
		const rx = cw * 0.32;
		const ry = ch * 0.3;

		cardRefs.current.forEach((card, i) => {
			if (!card) return;
			const angleDeg = i * ANGLE_STEP + orbitProxy.current.angle;
			const angleRad = (angleDeg * Math.PI) / 180;

			const depth = (Math.cos(angleRad) + 1) / 2;
			const isBehind = depth < 0.5;
			const opacity = isBehind ? 0.5 + depth * 0.35 : 0.65 + depth * 0.35;
			const scale = 0.85 + depth * 0.15;
			const blurPx = isBehind ? Math.round((0.5 - depth) * 14) : 0;
			const zIndex = isBehind
				? Math.round(depth * 8) + 1
				: Math.round(depth * 8) + VIDEO_Z_INDEX + 2;

			gsap.set(card, {
				left: "50%",
				top: "50%",
				x: rx * Math.sin(angleRad),
				y: ry * Math.cos(angleRad),
				xPercent: -50,
				yPercent: -50,
				opacity,
				scale,
				zIndex,
				filter: blurPx > 0 ? `blur(${blurPx}px)` : "none",
			});
			card.style.pointerEvents = depth > 0.25 ? "auto" : "none";
		});
	}, []);

	const startOrbit = useCallback(() => {
		orbitTweenRef.current?.kill();
		isPaused.current = false;
		orbitTweenRef.current = gsap.to(orbitProxy.current, {
			angle: "+=360",
			duration: 50,
			ease: "none",
			repeat: -1,
			onUpdate: updatePositions,
		});
		updatePositions();
	}, [updatePositions]);

	const stopOrbit = useCallback(() => {
		orbitTweenRef.current?.kill();
		orbitTweenRef.current = null;
		isPaused.current = true;
	}, []);

	const playOpenTransition = useCallback(
		(index: number) => {
			killTransition();
			isAnimating.current = true;
			stopOrbit();

			flushSync(() => setSelectedIndex(index));

			const panel = answerPanelRef.current;
			const content = answerContentRef.current;
			if (!panel || !content) {
				isAnimating.current = false;
				return;
			}

			gsap.set(panel, {
				opacity: 0,
				x: PANEL_SLIDE,
				width: 0,
				pointerEvents: "none",
			});
			gsap.set(content, { opacity: 0, y: 12 });

			const tl = gsap.timeline({
				onComplete: () => {
					isAnimating.current = false;
					gsap.set(panel, { pointerEvents: "auto" });
				},
			});
			transitionRef.current = tl;

			tl.to(
				cardsLayerRef.current,
				{ opacity: 0, duration: 0.45, ease: "power2.inOut" },
				0,
			)
				.to(
					videoSideRef.current,
					{
						width: "45%",
						duration: TRANSITION_DURATION,
						ease: TRANSITION_EASE,
					},
					0,
				)
				.to(
					panel,
					{
						width: "55%",
						opacity: 1,
						x: 0,
						duration: TRANSITION_DURATION,
						ease: TRANSITION_EASE,
					},
					0,
				)
				.to(
					content,
					{ opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
					0.28,
				);
		},
		[killTransition, stopOrbit],
	);

	const playSwitchTransition = useCallback(
		(index: number) => {
			killTransition();
			isAnimating.current = true;

			const content = answerContentRef.current;
			if (!content) {
				setSelectedIndex(index);
				isAnimating.current = false;
				return;
			}

			const tl = gsap.timeline({
				onComplete: () => {
					isAnimating.current = false;
				},
			});
			transitionRef.current = tl;

			tl.to(content, {
				opacity: 0,
				y: -10,
				duration: 0.22,
				ease: "power2.in",
			})
				.call(() => flushSync(() => setSelectedIndex(index)))
				.fromTo(
					content,
					{ opacity: 0, y: 14 },
					{ opacity: 1, y: 0, duration: 0.4, ease: "power3.out" },
				);
		},
		[killTransition],
	);

	const playCloseTransition = useCallback(() => {
		killTransition();
		isAnimating.current = true;

		const panel = answerPanelRef.current;
		const content = answerContentRef.current;

		const tl = gsap.timeline({
			onComplete: () => {
				isAnimating.current = false;
				setSelectedIndex(null);
				if (panel)
					gsap.set(panel, {
						x: PANEL_SLIDE,
						opacity: 0,
						width: 0,
						pointerEvents: "none",
					});
				if (content) gsap.set(content, { y: 12, opacity: 0 });
				startOrbit();
			},
		});
		transitionRef.current = tl;

		if (panel) gsap.set(panel, { pointerEvents: "none" });

		tl.to(
			content,
			{ opacity: 0, y: 10, duration: 0.3, ease: "power2.in" },
			0,
		)
			.to(
				panel,
				{
					opacity: 0,
					x: PANEL_SLIDE,
					width: 0,
					duration: TRANSITION_DURATION,
					ease: TRANSITION_EASE,
				},
				0,
			)
			.to(
				videoSideRef.current,
				{
					width: "100%",
					duration: TRANSITION_DURATION,
					ease: TRANSITION_EASE,
				},
				0,
			)
			.to(
				cardsLayerRef.current,
				{ opacity: 1, duration: 0.6, ease: "power3.out" },
				0.2,
			);
	}, [killTransition, startOrbit]);

	const handleSelectQuestion = useCallback(
		(index: number) => {
			if (isAnimating.current) return;
			if (selectedIndex === index) return;

			if (selectedIndex === null) {
				playOpenTransition(index);
			} else {
				playSwitchTransition(index);
			}
		},
		[selectedIndex, playOpenTransition, playSwitchTransition],
	);

	const handleClose = useCallback(() => {
		if (isAnimating.current || selectedIndex === null) return;
		playCloseTransition();
	}, [selectedIndex, playCloseTransition]);

	const handleVideoAreaClick = useCallback(() => {
		if (isAnimating.current) return;
		if (selectedIndex !== null) {
			handleClose();
			return;
		}
		openLandingCta("faq", loadInboundAttribution());
	}, [selectedIndex, handleClose]);

	const handleFaqSelect = useCallback((index: number) => {
		setFaqIndex((prev) => (prev === index ? null : index));
	}, []);

	useLayoutEffect(() => {
		if (answerPanelRef.current) {
			gsap.set(answerPanelRef.current, {
				opacity: 0,
				x: PANEL_SLIDE,
				width: 0,
				pointerEvents: "none",
			});
		}
		if (answerContentRef.current) {
			gsap.set(answerContentRef.current, { opacity: 0, y: 12 });
		}
	}, []);

	useEffect(() => {
		return () => killTransition();
	}, [killTransition]);
	useEffect(() => {
		const ctx = gsap.context(() => {
			gsap.from(sectionRef.current, {
				opacity: 0,
				duration: 1,
				ease: "power2.out",
			});
		});
		return () => ctx.revert();
	}, []);

	useEffect(() => {
		if (selectedIndex === null) startOrbit();
		return () => stopOrbit();
	}, [selectedIndex, startOrbit, stopOrbit]);

	useEffect(() => {
		const onResize = () => updatePositions();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [updatePositions]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && selectedIndex !== null) {
				handleClose();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [selectedIndex, handleClose]);

	return (
		<>
			<section
				ref={sectionRef}
				className="relative w-full bg-void overflow-hidden md:min-h-[100dvh]"
				id="hero"
			>
				{/* Background */}
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute inset-0 opacity-55 grid-overlay" />
					<div className="teal-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" />
				</div>

				{/* Bottom fade into next section */}
				<div
					className="absolute bottom-0 left-0 right-0 h-40 md:h-56 z-20 pointer-events-none"
					style={{
						background:
							"linear-gradient(to bottom, transparent 0%, var(--void) 88%)",
					}}
				/>

				{/* ─── Desktop ─── */}
				<div className="hidden md:flex relative z-10 w-full h-[100dvh] items-center justify-center">
					<div className="relative w-full h-full">
						{/* Video + orbit side */}
						<div
							ref={videoSideRef}
							className={`relative h-full flex items-center justify-center ${
								selectedIndex !== null ? "cursor-pointer" : ""
							}`}
							style={{
								width: "100%",
								height: "100%",
								transition: "none",
							}}
							onClick={
								selectedIndex !== null
									? handleClose
									: undefined
							}
						>
							{/* Orbit layer — cards only (video stays visible on select) */}
							<div
								ref={questionsRef}
								className="absolute inset-0"
							>
								<div
									ref={cardsLayerRef}
									className="absolute inset-0"
									style={{
										pointerEvents:
											selectedIndex !== null
												? "none"
												: "auto",
									}}
								>
									{qaData.map((qa, i) => (
										<div
											key={i}
											ref={(el) => {
												cardRefs.current[i] = el;
											}}
											className="absolute"
											style={{ width: 280 }}
											onMouseEnter={stopOrbit}
											onMouseLeave={() => {
												if (
													selectedIndex === null &&
													!isAnimating.current
												)
													startOrbit();
											}}
										>
											<OrbitCard
												question={qa.question}
												onClick={() =>
													handleSelectQuestion(i)
												}
											/>
										</div>
									))}
								</div>

								{/* VP9 alpha video — sits between back and front cards */}
								<div
									className="absolute inset-0 flex items-center justify-center"
									style={{ zIndex: VIDEO_Z_INDEX }}
								>
									<div
										className="absolute w-[70%] h-[70%] pointer-events-none"
										style={{
											background:
												"radial-gradient(ellipse at center, rgba(13,183,187,0.1) 0%, transparent 65%)",
										}}
									/>
									{selectedIndex === null && (
										<button
											type="button"
											className="absolute inset-0 z-20 cursor-pointer bg-transparent"
											onClick={handleVideoAreaClick}
											aria-label="Learn more"
										/>
									)}
									<VideoVignette
										variant="landscape"
										className="w-full h-full pointer-events-none"
									>
										<HeroVideo
											src={HERO_VIDEO_LANDSCAPE}
											className="w-full h-full drop-shadow-[0_24px_80px_rgba(13,183,187,0.18)]"
										/>
									</VideoVignette>
								</div>
							</div>

							{/* Dot nav when answer is open */}
							{selectedIndex !== null && (
								<div
									className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30"
									onClick={(e) => e.stopPropagation()}
								>
									{qaData.map((_, i) => (
										<button
											key={i}
											onClick={() =>
												handleSelectQuestion(i)
											}
											className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
												i === selectedIndex
													? "bg-teal border-teal scale-125"
													: "bg-transparent border-text-secondary/40 hover:border-teal"
											}`}
											aria-label={`Question ${i + 1}`}
										/>
									))}
								</div>
							)}
						</div>

						{/* Answer panel — absolute so orbit stays viewport-centered when closed */}
						<div
							ref={answerPanelRef}
							className="absolute right-0 top-0 bottom-0 flex items-center overflow-hidden"
							style={{ width: 0 }}
							aria-hidden={selectedIndex === null}
							onClick={(e) => e.stopPropagation()}
						>
							<div
								ref={answerContentRef}
								className="w-full max-w-[540px] pl-10 lg:pl-16"
							>
								{selectedIndex !== null && (
									<>
										<button
											onClick={handleClose}
											className="flex items-center gap-2 text-text-secondary hover:text-teal transition-colors mb-6 group"
										>
											<X
												size={16}
												className="group-hover:rotate-90 transition-transform duration-300"
											/>
											<span className="font-ibm text-[11px] uppercase tracking-wider">
												Close
											</span>
										</button>

										<div className="relative overflow-hidden rounded-xl p-8 lg:p-10 backdrop-blur-xl bg-[rgba(6,8,16,0.6)] border border-[rgba(13,183,187,0.25)] shadow-[0_0_40px_rgba(13,183,187,0.08)]">
											<div className="absolute top-0 left-0 w-12 h-12 pointer-events-none">
												<div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-teal/70 to-transparent" />
												<div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-teal/70 to-transparent" />
											</div>
											<div className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none">
												<div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-teal/50 to-transparent" />
												<div className="absolute bottom-0 right-0 h-full w-px bg-gradient-to-t from-teal/50 to-transparent" />
											</div>

											<h2 className="font-dm text-[24px] lg:text-[30px] font-semibold text-text-primary leading-tight">
												{qaData[selectedIndex].question}
											</h2>
											<div className="w-12 h-px bg-teal/40 my-5" />
											<p className="font-lora text-[15px] lg:text-[16px] text-text-secondary leading-[1.8]">
												{qaData[selectedIndex].answer}
											</p>
										</div>

										<LearnMoreLink className="mt-6 text-[14px] py-3 px-8" />

										<div className="mt-6 flex flex-wrap gap-2">
											{qaData.map((qa, i) => {
												if (i === selectedIndex)
													return null;
												return (
													<button
														key={i}
														onClick={() =>
															handleSelectQuestion(
																i,
															)
														}
														className="font-dm text-[12px] text-text-secondary hover:text-teal border border-[rgba(13,183,187,0.15)] hover:border-teal/40 rounded-lg px-3 py-1.5 transition-all duration-300 hover:shadow-[0_0_16px_rgba(13,183,187,0.1)]"
													>
														{qa.question}
													</button>
												);
											})}
										</div>
									</>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* ─── Mobile hero — full viewport video ─── */}
				<div className="md:hidden relative z-10 h-[100dvh] w-full overflow-hidden">
					<div className="absolute inset-0 pointer-events-none">
						<div
							className="absolute inset-0"
							style={{
								background:
									"radial-gradient(ellipse at 50% 60%, rgba(13,183,187,0.14) 0%, transparent 55%)",
							}}
						/>
						<div className="absolute inset-0 opacity-30 grid-overlay" />
					</div>
					<VideoVignette
						variant="portrait"
						className="absolute inset-0 w-full h-full"
					>
						<HeroVideo
							src={HERO_VIDEO_PORTRAIT}
							fit="cover"
							className="absolute inset-0 w-full h-full"
						/>
					</VideoVignette>
					<div
						className="absolute bottom-0 left-0 right-0 h-36 z-[1] pointer-events-none"
						style={{
							background:
								"linear-gradient(to bottom, transparent 0%, var(--void) 90%)",
						}}
					/>
					<a
						href="#hero-faq"
						className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
						aria-label="Scroll to questions"
					>
						<span className="rounded-full border border-teal/50 bg-void/80 backdrop-blur-md px-5 py-2 font-ibm text-[11px] uppercase tracking-[0.28em] text-text-primary shadow-[0_0_28px_rgba(13,183,187,0.4)]">
							Explore
						</span>
						<ChevronDown
							size={22}
							strokeWidth={2.5}
							className="text-teal animate-bounce drop-shadow-[0_0_12px_rgba(13,183,187,0.6)]"
						/>
					</a>
				</div>
			</section>

			<HeroFaq activeIndex={faqIndex} onSelect={handleFaqSelect} />
		</>
	);
}
