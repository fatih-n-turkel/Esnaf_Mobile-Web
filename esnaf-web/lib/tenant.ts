export function withBusinessId(url: string, businessId?: string | null) {
  if (!businessId) return url;
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}businessId=${encodeURIComponent(businessId)}`;
}
