import { FaShoppingBag, FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaReact } from 'react-icons/fa'
import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>
              <FaShoppingBag className="footer-logo" />
              Catálogo Online
            </h3>
            <p>Sua loja virtual completa com os melhores produtos e preços.</p>
          </div>

          <div className="footer-section">
            <h4>Categorias</h4>
            <ul>
              <li><a href="#eletronicos">Eletrônicos</a></li>
              <li><a href="#moda">Moda</a></li>
              <li><a href="#moveis">Móveis</a></li>
              <li><a href="#casa">Casa & Cozinha</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Atendimento</h4>
            <ul>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#contato">Contato</a></li>
              <li><a href="#trocas">Trocas e Devoluções</a></li>
              <li><a href="#entrega">Prazos de Entrega</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Redes Sociais</h4>
            <div className="social-links">
              <a href="#facebook" className="social-link">
                <FaFacebook /> Facebook
              </a>
              <a href="#instagram" className="social-link">
                <FaInstagram /> Instagram
              </a>
              <a href="#twitter" className="social-link">
                <FaTwitter /> Twitter
              </a>
              <a href="#youtube" className="social-link">
                <FaYoutube /> YouTube
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} Catálogo Online.</p>
          <p className="footer-dev">
            
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
