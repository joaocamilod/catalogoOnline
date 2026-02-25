import {
  ShoppingBag,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";

function Footer({ storeSettings }) {
  const currentYear = new Date().getFullYear();
  const storeName = storeSettings?.nome_loja || "Catálogo Online";

  const categoryLinks = ["Eletrônicos", "Moda", "Móveis", "Casa & Cozinha"];
  const supportLinks = [
    "FAQ",
    "Contato",
    "Trocas e Devoluções",
    "Prazos de Entrega",
  ];
  const socialLinks = [
    { Icon: Facebook, label: "Facebook", href: storeSettings?.facebook_url },
    { Icon: Instagram, label: "Instagram", href: storeSettings?.instagram_url },
    { Icon: Twitter, label: "Twitter", href: storeSettings?.twitter_url },
    { Icon: Youtube, label: "YouTube", href: storeSettings?.youtube_url },
  ];

  return (
    <footer className="bg-[#0F1724] text-white mt-16" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <ShoppingBag
                  className="h-5 w-5 text-white"
                  aria-hidden="true"
                />
              </div>
              <span className="text-lg font-bold">{storeName}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {storeSettings?.footer_descricao ||
                "Sua loja virtual completa com os melhores produtos e precos do mercado. Qualidade e conveniencia em um so lugar."}
            </p>
            {storeSettings?.footer_observacoes && (
              <p className="text-gray-500 text-xs leading-relaxed mt-3">
                {storeSettings.footer_observacoes}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
              Categorias
            </h3>
            <ul className="space-y-3">
              {categoryLinks.map((cat) => (
                <li key={cat}>
                  <a
                    href={`#${cat}`}
                    className="text-gray-400 hover:text-violet-400 text-sm transition-colors duration-150 inline-block hover:translate-x-1 transition-transform"
                  >
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
              Atendimento
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((item) => (
                <li key={item}>
                  <a
                    href={`#${item}`}
                    className="text-gray-400 hover:text-violet-400 text-sm transition-colors duration-150 inline-block hover:translate-x-1 transition-transform"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
              Redes Sociais
            </h3>
            <div className="flex flex-col gap-3">
              {socialLinks.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href || "#"}
                  aria-label={label}
                  target={href ? "_blank" : undefined}
                  rel={href ? "noreferrer" : undefined}
                  className="flex items-center gap-3 text-gray-400 hover:text-violet-400 text-sm transition-all duration-150 hover:translate-x-1 group"
                >
                  <span className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors flex-shrink-0">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-sm">
            © {currentYear} {storeName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
