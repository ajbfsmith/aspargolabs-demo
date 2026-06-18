import Link from "next/link";

const navLinks = [
	{ label: "Home", href: "/" },
	{ label: "Blog", href: "/blog" },
	{ label: "About", href: "/about" },
];

const legalLinks = [
	{ label: "Privacy Policy", href: "#" },
	{ label: "Terms of Use", href: "#" },
];

export default function Footer() {
	return (
		<footer className="relative bg-graphite rounded-t-[2rem] md:rounded-t-[4rem] pt-12 md:pt-20 pb-10 md:pb-12 overflow-hidden border-t border-[rgba(13,183,187,0.28)] shadow-[0_-16px_48px_rgba(0,0,0,0.45)]">
			<div
				className="absolute inset-x-0 top-0 h-24 pointer-events-none"
				style={{
					background:
						"radial-gradient(ellipse at top, rgba(13,183,187,0.08), transparent 70%)",
				}}
			/>
			<div className="grid-overlay absolute inset-0 opacity-50 pointer-events-none" />

			<div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-16">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
					<div>
						<Link href="/" className="flex items-center gap-1 mb-4">
							<span className="font-dm text-[16px] font-light tracking-wide text-text-primary">
								ACCELERATE
							</span>
							<span className="text-teal mx-1">·</span>
							<span className="font-ibm text-[13px] font-light tracking-wider text-text-secondary">
								HEALTH
							</span>
						</Link>
						<p className="font-lora text-[15px] italic text-text-secondary leading-[1.7]">
							Precision delivery. Human outcomes.
						</p>
					</div>

					<div>
						<h4 className="font-dm text-[13px] font-medium text-text-primary uppercase tracking-wider mb-4">
							Navigation
						</h4>
						<div className="grid grid-cols-2 gap-2">
							{navLinks.map((link) => (
								<Link
									key={link.label}
									href={link.href}
									className="font-dm text-[14px] text-text-secondary link-hover py-1"
								>
									{link.label}
								</Link>
							))}
						</div>
					</div>

					<div>
						<h4 className="font-dm text-[13px] font-medium text-text-primary uppercase tracking-wider mb-4">
							Legal
						</h4>
						<div className="flex flex-col gap-2">
							{legalLinks.map((link) => (
								<a
									key={link.label}
									href={link.href}
									className="font-dm text-[14px] text-text-secondary link-hover py-1"
								>
									{link.label}
								</a>
							))}
							<p className="font-ibm text-[12px] text-text-secondary mt-4">
								&copy;2026 Accelerate Health<sup>&trade;</sup>
			
							</p>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
