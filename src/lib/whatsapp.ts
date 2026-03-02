const MOBILE_UA_REGEX = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i;

function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return MOBILE_UA_REGEX.test(navigator.userAgent || "");
}

function buildWhatsappUrl(phone: string, message: string): string {
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

export function openPendingPopup(): Window | null {
  if (typeof window === "undefined") return null;
  try {
    return window.open("about:blank", "_blank", "noopener,noreferrer");
  } catch {
    return null;
  }
}

export function openWhatsAppChat(
  phone: string,
  message: string,
  pendingPopup?: Window | null,
): boolean {
  if (typeof window === "undefined") return false;

  const url = buildWhatsappUrl(phone, message);
  const mobile = isMobileBrowser();

  if (pendingPopup && !pendingPopup.closed) {
    pendingPopup.location.href = url;
    return true;
  }

  if (mobile) {
    window.location.href = url;
    return true;
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  return Boolean(opened);
}
