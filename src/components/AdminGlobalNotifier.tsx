import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type NoticeType = "success" | "error" | "info";

interface NoticePayload {
  message: string;
  type?: NoticeType;
  duration?: number;
}

interface NoticeItem {
  id: string;
  message: string;
  type: NoticeType;
}

export const notifyAdmin = ({
  message,
  type = "success",
  duration = 3500,
}: NoticePayload) => {
  window.dispatchEvent(
    new CustomEvent("admin:notify", { detail: { message, type, duration } }),
  );
};

const typeStyles: Record<NoticeType, string> = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const typeIconStyles: Record<NoticeType, string> = {
  success: "text-green-500",
  error: "text-red-500",
  info: "text-blue-500",
};

const typeIcon = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export default function AdminGlobalNotifier() {
  const [items, setItems] = useState<NoticeItem[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<NoticePayload>;
      const message = custom.detail?.message?.trim();
      if (!message) return;

      const type = custom.detail?.type ?? "success";
      const duration = custom.detail?.duration ?? 3500;
      const id = crypto.randomUUID();

      setItems((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, duration);
    };

    window.addEventListener("admin:notify", handler);
    return () => window.removeEventListener("admin:notify", handler);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 w-[min(92vw,420px)]">
      {items.map((item) => {
        const Icon = typeIcon[item.type];
        return (
          <div
            key={item.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-fadeIn ${typeStyles[item.type]}`}
          >
            <Icon
              className={`h-5 w-5 mt-0.5 flex-shrink-0 ${typeIconStyles[item.type]}`}
            />
            <p className="text-sm font-medium flex-1">{item.message}</p>
            <button
              type="button"
              onClick={() =>
                setItems((prev) =>
                  prev.filter((notice) => notice.id !== item.id),
                )
              }
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
