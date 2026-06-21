export function withBlogCheckoutAttribution(
  href: string,
  postSlug: string,
): string {
  if (href === "/checkout" || href === "/checkout/") {
    return `/checkout?post=${encodeURIComponent(postSlug)}`;
  }

  if (!href.startsWith("/checkout?")) {
    return href;
  }

  const url = new URL(href, "http://localhost");
  if (!url.searchParams.has("post")) {
    url.searchParams.set("post", postSlug);
  }
  return `${url.pathname}?${url.searchParams.toString()}`;
}
