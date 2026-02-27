import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLoja, signUp } from "../lib/supabase";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const NewStore: React.FC = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [emailAdmin, setEmailAdmin] = useState("");
  const [senhaAdmin, setSenhaAdmin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setOkMessage(null);

    const normalizedSlug = slug.trim().toLowerCase();
    if (!slugPattern.test(normalizedSlug)) {
      setError("Slug inválido. Use letras minúsculas, números e hífen.");
      return;
    }

    setLoading(true);
    try {
      const loja = await createLoja({ nome, slug: normalizedSlug });

      await signUp(emailAdmin, senhaAdmin, "Administrador", loja.id, "admin");
      setOkMessage(
        "Loja criada com sucesso. Confirme o e-mail do admin e entre no painel da loja.",
      );
      navigate(`/admin/${loja.slug}`);
    } catch (e: any) {
      setError(e?.message || "Erro ao criar loja.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <section className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Nova loja</h1>
        <p className="text-sm text-gray-500 mt-2">
          Crie um tenant com slug único e o primeiro usuário administrador.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm text-gray-700">Nome da loja</span>
            <input
              className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-700">Slug</span>
            <input
              className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="loja-calcados"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-700">E-mail do admin</span>
            <input
              type="email"
              className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5"
              value={emailAdmin}
              onChange={(e) => setEmailAdmin(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-700">Senha do admin</span>
            <input
              type="password"
              minLength={6}
              className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5"
              value={senhaAdmin}
              onChange={(e) => setSenhaAdmin(e.target.value)}
              required
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {okMessage && <p className="text-sm text-green-700">{okMessage}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-semibold disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar loja"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default NewStore;
