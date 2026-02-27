import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLojasPublic, type Loja } from "../lib/supabase";

const Landing: React.FC = () => {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLojasPublic()
      .then(setLojas)
      .catch(() => setError("Não foi possível carregar as lojas."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <section className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Catálogo Online Multi-tenant
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Cada loja possui catálogo, usuários e painel admin isolados por
            tenant.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/nova-loja"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Criar nova loja
            </Link>
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-800 text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Login global
            </Link>
          </div>
        </div>

        <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Lojas disponíveis
          </h2>
          {loading ? (
            <p className="text-sm text-gray-500 mt-3">Carregando lojas...</p>
          ) : error ? (
            <p className="text-sm text-red-600 mt-3">{error}</p>
          ) : lojas.length === 0 ? (
            <p className="text-sm text-gray-500 mt-3">
              Nenhuma loja cadastrada ainda.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lojas.map((loja) => (
                <li
                  key={loja.id}
                  className="border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{loja.nome}</p>
                    <p className="text-sm text-gray-500">/{loja.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/${loja.slug}`}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100"
                    >
                      Ver catálogo
                    </Link>
                    <Link
                      to={`/admin/${loja.slug}`}
                      className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black"
                    >
                      Admin
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
};

export default Landing;
