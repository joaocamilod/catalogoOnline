import {
  ShoppingBag,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";

function Footer({ storeSettings, tema }) {
  const currentYear = new Date().getFullYear();
  const storeName = storeSettings?.nome_loja || "Catálogo Online";

  const socialLinks = [
    { Icon: Facebook, label: "Facebook", href: storeSettings?.facebook_url },
    { Icon: Instagram, label: "Instagram", href: storeSettings?.instagram_url },
    { Icon: Twitter, label: "Twitter", href: storeSettings?.twitter_url },
    { Icon: Youtube, label: "YouTube", href: storeSettings?.youtube_url },
  ];

  return (
    <footer
      className={`mt-10 ${!tema ? "bg-[#0F1724] text-white" : ""}`}
      style={
        tema
          ? {
              backgroundColor: tema.footer_bg_cor,
              color: tema.footer_texto_cor,
            }
          : undefined
      }
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <ShoppingBag
                  className="h-5 w-5 text-white"
                  aria-hidden="true"
                />
              </div>
              <span className="text-base font-bold">{storeName}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {storeSettings?.footer_descricao ||
                "Sua loja virtual completa com os melhores produtos e precos do mercado. Qualidade e conveniencia em um so lugar."}
            </p>
            {storeSettings?.footer_observacoes && (
              <p className="text-gray-500 text-xs leading-relaxed mt-2">
                {storeSettings.footer_observacoes}
              </p>
            )}
          </div>

          <div className="lg:justify-self-end">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Redes Sociais
            </h3>
            <div className="flex flex-col gap-2.5">
              {socialLinks.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href || "#"}
                  aria-label={label}
                  target={href ? "_blank" : undefined}
                  rel={href ? "noreferrer" : undefined}
                  className="flex items-center gap-2 text-gray-400 hover:text-violet-400 text-xs transition-all duration-150 group"
                >
                  <span className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors flex-shrink-0">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 flex items-center justify-center">
          <p className="text-gray-500 text-xs sm:text-sm text-center">
            © {currentYear} {storeName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
