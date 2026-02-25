import React, { useEffect, useState } from "react";
import { updateStoreSettings, type StoreSettings } from "../../lib/supabase";

interface StoreSettingsManagerProps {
  storeSettings: StoreSettings;
  onStoreSettingsChange: (settings: StoreSettings) => void;
}

const StoreSettingsManager: React.FC<StoreSettingsManagerProps> = ({
  storeSettings,
  onStoreSettingsChange,
}) => {
  const [draftSettings, setDraftSettings] = useState(storeSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  useEffect(() => {
    setDraftSettings(storeSettings);
  }, [storeSettings]);

  const handleSaveSettings = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSettingsFeedback(null);
    setIsSavingSettings(true);

    try {
      const updatedSettings = await updateStoreSettings(draftSettings);
      onStoreSettingsChange(updatedSettings);
      setDraftSettings(updatedSettings);
      setSettingsFeedback("Configurações da loja atualizadas com sucesso.");
    } catch (error: any) {
      setSettingsFeedback(
        error?.message || "Nao foi possivel salvar as configurações da loja.",
      );
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
        Edite o nome, observações e informações da sua loja.
      </p>

      <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="nome-loja"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nome da loja
          </label>
          <input
            id="nome-loja"
            type="text"
            value={draftSettings.nome_loja}
            onChange={(e) =>
              setDraftSettings((prev) => ({
                ...prev,
                nome_loja: e.target.value,
              }))
            }
            placeholder="Ex.: Loja do Joao"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            maxLength={80}
          />
        </div>

        <div>
          <label
            htmlFor="footer-descricao"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Descrição
          </label>
          <textarea
            id="footer-descricao"
            value={draftSettings.footer_descricao}
            onChange={(e) =>
              setDraftSettings((prev) => ({
                ...prev,
                footer_descricao: e.target.value,
              }))
            }
            placeholder="Texto principal exibido no footer"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            maxLength={350}
          />
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
            placeholder="Informacoes extras (entregas, horarios, contato etc.)"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={2}
            maxLength={350}
          />
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
