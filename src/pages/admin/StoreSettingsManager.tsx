import React, { useEffect, useState } from "react";
import { updateStoreSettings, type StoreSettings } from "../../lib/supabase";
import { notifyAdmin } from "../../components/AdminGlobalNotifier";

interface StoreSettingsManagerProps {
  storeSettings: StoreSettings;
  onStoreSettingsChange: (settings: StoreSettings) => void;
}

const StoreSettingsManager: React.FC<StoreSettingsManagerProps> = ({
  storeSettings,
  onStoreSettingsChange,
}) => {
  const formatWhatsappPhone = (rawValue: string) => {
    let digits = rawValue.replace(/\D/g, "");
    if (digits.startsWith("55") && digits.length > 11) {
      digits = digits.slice(2);
    }
    digits = digits.slice(0, 11);

    if (!digits) return "";
    if (digits.length < 3) return `(${digits}`;

    const ddd = digits.slice(0, 2);
    const numero = digits.slice(2);

    if (!numero) return `(${ddd}`;
    if (numero.length <= 4) return `(${ddd}) ${numero}`;
    if (numero.length <= 8) {
      return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
    }
    return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
  };

  const [draftSettings, setDraftSettings] = useState(storeSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    nome_loja?: string;
    footer_descricao?: string;
    telefone_contato_whatsapp?: string;
  }>({});

  useEffect(() => {
    setDraftSettings(storeSettings);
  }, [storeSettings]);

  const handleSaveSettings = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSettingsFeedback(null);

    const nextErrors: {
      nome_loja?: string;
      footer_descricao?: string;
      telefone_contato_whatsapp?: string;
    } = {};
    if (!draftSettings.nome_loja.trim()) {
      nextErrors.nome_loja = "Nome da loja é obrigatório.";
    }
    if (!draftSettings.footer_descricao.trim()) {
      nextErrors.footer_descricao = "Descrição é obrigatória.";
    }
    const whatsappDigits = (
      draftSettings.telefone_contato_whatsapp || ""
    ).replace(/\D/g, "");
    if (
      draftSettings.telefone_contato_whatsapp.trim() &&
      whatsappDigits.length < 10
    ) {
      nextErrors.telefone_contato_whatsapp =
        "Informe um telefone válido com DDD (mínimo 10 dígitos).";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsSavingSettings(true);

    try {
      const updatedSettings = await updateStoreSettings(draftSettings);
      onStoreSettingsChange(updatedSettings);
      setDraftSettings(updatedSettings);
      setSettingsFeedback("Configurações da loja atualizadas com sucesso.");
      notifyAdmin({
        message: "Configurações da loja atualizadas com sucesso.",
        type: "success",
      });
    } catch (error: any) {
      setSettingsFeedback(
        error?.message || "Nao foi possivel salvar as configurações da loja.",
      );
      notifyAdmin({
        message:
          error?.message || "Não foi possível salvar as configurações da loja.",
        type: "error",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
      <h1 className="text-base font-semibold text-gray-900">
        Configurações da loja
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Edite o nome, observações, endereço e informações da sua loja.
      </p>

      <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="nome-loja"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nome da loja *
          </label>
          <input
            id="nome-loja"
            type="text"
            value={draftSettings.nome_loja}
            onChange={(e) => {
              setDraftSettings((prev) => ({
                ...prev,
                nome_loja: e.target.value,
              }));
              if (fieldErrors.nome_loja) {
                setFieldErrors((prev) => ({ ...prev, nome_loja: undefined }));
              }
            }}
            placeholder="Ex.: Loja do Joao"
            className={`w-full px-3 py-2.5 rounded-xl border transition-all ${
              fieldErrors.nome_loja
                ? "border-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500"
                : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            maxLength={80}
          />
          {fieldErrors.nome_loja && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.nome_loja}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="footer-descricao"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Descrição *
          </label>
          <textarea
            id="footer-descricao"
            value={draftSettings.footer_descricao}
            onChange={(e) => {
              setDraftSettings((prev) => ({
                ...prev,
                footer_descricao: e.target.value,
              }));
              if (fieldErrors.footer_descricao) {
                setFieldErrors((prev) => ({
                  ...prev,
                  footer_descricao: undefined,
                }));
              }
            }}
            placeholder="Texto principal exibido no footer"
            className={`w-full px-3 py-2.5 rounded-xl border transition-all ${
              fieldErrors.footer_descricao
                ? "border-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500"
                : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            rows={3}
            maxLength={350}
          />
          {fieldErrors.footer_descricao && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.footer_descricao}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="footer-observacoes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Observações da loja
          </label>
          <textarea
            id="footer-observacoes"
            value={draftSettings.footer_observacoes}
            onChange={(e) =>
              setDraftSettings((prev) => ({
                ...prev,
                footer_observacoes: e.target.value,
              }))
            }
            placeholder="Informações extras..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={2}
            maxLength={350}
          />
        </div>

        <div>
          <label
            htmlFor="footer-endereco"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Endereço da loja
          </label>
          <textarea
            id="footer-endereco"
            value={draftSettings.footer_endereco}
            onChange={(e) =>
              setDraftSettings((prev) => ({
                ...prev,
                footer_endereco: e.target.value,
              }))
            }
            placeholder="Ex.: Rua Exemplo, 123 - Centro, São Paulo - SP"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={2}
            maxLength={220}
          />
        </div>

        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">
            Telefone de contato
          </p>
          <label
            htmlFor="telefone-contato-whatsapp"
            className="block text-xs text-gray-500 mb-1"
          >
            Informe o WhatsApp da loja
          </label>
          <input
            id="telefone-contato-whatsapp"
            type="tel"
            value={draftSettings.telefone_contato_whatsapp}
            onChange={(e) => {
              const formattedPhone = formatWhatsappPhone(e.target.value);
              setDraftSettings((prev) => ({
                ...prev,
                telefone_contato_whatsapp: formattedPhone,
              }));
              if (fieldErrors.telefone_contato_whatsapp) {
                setFieldErrors((prev) => ({
                  ...prev,
                  telefone_contato_whatsapp: undefined,
                }));
              }
            }}
            placeholder="Ex.: (11) 99999-9999"
            className={`w-full px-3 py-2.5 rounded-xl border transition-all ${
              fieldErrors.telefone_contato_whatsapp
                ? "border-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500"
                : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            maxLength={15}
          />
          <p className="mt-1 text-xs text-gray-500">
            Se preenchido, será exibido um botão flutuante de WhatsApp na página
            principal do catálogo.
          </p>
          {fieldErrors.telefone_contato_whatsapp && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.telefone_contato_whatsapp}
            </p>
          )}
        </div>

        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">
            Redes Sociais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="url"
            value={draftSettings.facebook_url}
            onChange={(e) =>
              setDraftSettings((prev) => ({
                ...prev,
                facebook_url: e.target.value,
              }))
            }
            placeholder="URL Facebook"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="url"
            value={draftSettings.instagram_url}
            onChange={(e) =>
              setDraftSettings((prev) => ({
                ...prev,
                instagram_url: e.target.value,
              }))
            }
            placeholder="URL Instagram"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="url"
            value={draftSettings.twitter_url}
            onChange={(e) =>
              setDraftSettings((prev) => ({
                ...prev,
                twitter_url: e.target.value,
              }))
            }
            placeholder="URL Twitter/X"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="url"
            value={draftSettings.youtube_url}
            onChange={(e) =>
              setDraftSettings((prev) => ({
                ...prev,
                youtube_url: e.target.value,
              }))
            }
            placeholder="URL YouTube"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSavingSettings}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSavingSettings ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>

      {settingsFeedback && (
        <p className="mt-3 text-sm text-gray-600">{settingsFeedback}</p>
      )}
    </section>
  );
};

export default StoreSettingsManager;
