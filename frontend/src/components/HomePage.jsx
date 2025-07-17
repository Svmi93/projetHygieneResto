// frontend/src/components/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importe useAuth pour accéder aux infos utilisateur
import './HomePage.css';

function HomePage({ getDashboardPath }) { // getDashboardPath est toujours nécessaire ici
  const { user, isAuthenticated } = useAuth(); // Récupère l'utilisateur et l'état d'authentification
  const apiName = "HYGIE-SECURITE-RESTO HACCP";

  // Détermine le logo à afficher : si authentifié, si user existe, si c'est un admin_client ou employer, et si logoUrl existe
  const displayLogo = isAuthenticated && user && (user.role === 'admin_client' || user.role === 'employer') && user.logoUrl;

  return (
    <div className="home-page-container">
      <>
        <div className="home-page-header">
          {/* Affiche le logo de l'entreprise si l'utilisateur est connecté et qu'il a un logo */}
          {displayLogo ? (
            <img src={user.logoUrl} alt="Logo de l'entreprise" className="company-logo" />
          ) : (
            // Sinon, affiche le logo par défaut de l'API
            <img src="./src/assets/image/logo_1.png" alt="Logo de l'API" className="home-page-logo" />
          )}

          {/* Contenu conditionnel basé sur l'authentification */}
          {isAuthenticated ? (
            <>
              <h1>Bienvenue de retour, {user?.prenom} !</h1>
              <p className="subtitle">Explorez les dernières mises à jour ou accédez à votre tableau de bord.</p>
              <div className="action-buttons mt-4">
                <Link to={getDashboardPath(user?.role)} className="cta-button">
                  Aller à mon Tableau de bord
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1>Bienvenue sur {apiName} : L'Hygiène et la Sécurité Simplifiées pour la Restauration</h1>
              <p className="subtitle">Préparez-vous à chaque contrôle, sans stress.</p>
            </>
          )}
        </div>

        <section className="intro-section">
          <p>
            Dans le monde exigeant de la restauration et des commerces alimentaires, l'hygiène, la sécurité et la traçabilité sont essentielles. Notre API est conçue pour être votre alliée, transformant la complexité des normes en procédures claires et gérables. Soyez prêt à tout moment à passer un contrôle sans la moindre inquiétude !
          </p>
        </section>

        <hr />

        <section className="features-section">
          <h2>Comment {apiName} Révolutionne votre Quotidien :</h2>

          <div className="feature-item">
            <h3>1. Gestion Intégrée de l'Hygiène et la Sécurité Incendie</h3>
            <p>
              Fini les classeurs et les papiers éparpillés ! Notre API vous offre une plateforme centralisée pour organiser et suivre toutes vos procédures d'hygiène et de sécurité incendie. Gérez vos plans HACCP, vos protocoles de nettoyage, et vos vérifications incendie en quelques clics.
            </p>
          </div>

          <div className="feature-item">
            <h3>2. Suivi Précis des Températures</h3>
            <p>
              Ne laissez aucune fluctuation vous échapper. Intégrez facilement la prise de température de vos équipements et de vos produits. L'API vous aide à enregistrer, analyser et alerter en cas de non-conformité, garantissant la sécurité alimentaire de A à Z.
            </p>
          </div>

          <div className="feature-item">
            <h3>3. Traçabilité des Emballages de Production</h3>
            <p>
              La traçabilité est un pilier de la sécurité alimentaire. Grâce à la prise de visuel de vos emballages de production, notre API vous aide à résoudre les soucis de traçabilité, assurant un suivi impeccable de chaque lot et une réponse rapide en cas de besoin.
            </p>
          </div>

          <div className="feature-item">
            <h3>4. Règles et Réglementations Toujours à Jour</h3>
            <p>
              Restez informé des dernières normes ! Notre API intègre les règles d'hygiène et de sécurité propres à la restauration. Cela vous permet de mieux appréhender les attentes des contrôleurs d'hygiène et de sécurité, et d'être toujours en conformité.
            </p>
          </div>

          <div className="feature-item">
            <h3>5. Accès Facile aux Documents Légaux</h3>
            <p>
              Imaginez avoir tous vos documents légaux (autorisations, certificats, registres) disponibles et à jour, accessibles instantanément en cas de contrôle. Notre API vous permet de stocker et de gérer ces documents essentiels, vous offrant une tranquillité d'esprit inégalée.
            </p>
          </div>
        </section>

        <hr />

        <section className="promise-section">
          <h2>Notre Promesse : La Sérénité au Quotidien</h2>
          <p>
            L'objectif de {apiName} est clair : vous permettre d'être **prêt à tout moment** à passer un contrôle sanitaire ou de sécurité, sans stress ni imprévu. Concentrez-vous sur ce que vous faites de mieux : ravir vos clients, pendant que nous veillons sur votre conformité.
          </p>
        </section>

        <footer className="call-to-action-footer">
          <h2>Prêt à Transformer votre Gestion ?</h2>
          <div className="action-buttons">
            <button className="cta-button"><a href="#">Contactez-nous</a></button>
          </div>
        </footer>
      </>
    </div>
  );
}

export default HomePage;



















// // src/HomePage.jsx
// import React from 'react';
// import './HomePage.css'; // Assurez-vous que ce chemin est correct

// function HomePage() {
//   const apiName = "HYGIE-RESTO"; // <--- REMPLACEZ PAR LE NOM DE VOTRE API

//   return (
//     <div className="home-page-container">
//       <div className="home-page-header">
//         {/* Vous pouvez insérer votre logo ici. Par exemple: */}
//         <img src="./src/assets/image/logo_1.png" alt="Logo de l'API" className="home-page-logo" />
//         <h1>Bienvenue sur {apiName} : L'Hygiène et la Sécurité Simplifiées pour la Restauration</h1>
//         <p className="subtitle">Préparez-vous à chaque contrôle, sans stress.</p>
//       </div>

//       <section className="intro-section">
//         <p>
//           Dans le monde exigeant de la restauration et des commerces alimentaires, l'hygiène, la sécurité et la traçabilité sont essentielles. Notre API est conçue pour être votre alliée, transformant la complexité des normes en procédures claires et gérables. Soyez prêt à tout moment à passer un contrôle sans la moindre inquiétude !
//         </p>
//       </section>

//       <hr /> {/* Ligne de séparation */}

//       <section className="features-section">
//         <h2>Comment {apiName} Révolutionne votre Quotidien :</h2>

//         <div className="feature-item">
//           <h3>1. Gestion Intégrée de l'Hygiène et la Sécurité Incendie</h3>
//           {/* Ici, vous pouvez ajouter une icône pertinente, par exemple: */}
//           {/* <img src="/icons/fire-safety.png" alt="Sécurité Incendie" className="feature-icon" /> */}
//           <p>
//             Fini les classeurs et les papiers éparpillés ! Notre API vous offre une plateforme centralisée pour organiser et suivre toutes vos procédures d'hygiène et de sécurité incendie. Gérez vos plans HACCP, vos protocoles de nettoyage, et vos vérifications incendie en quelques clics.
//           </p>
//         </div>

//         <div className="feature-item">
//           <h3>2. Suivi Précis des Températures</h3>
//           {/* Icône de thermomètre ici */}
//           <p>
//             Ne laissez aucune fluctuation vous échapper. Intégrez facilement la prise de température de vos équipements et de vos produits. L'API vous aide à enregistrer, analyser et alerter en cas de non-conformité, garantissant la sécurité alimentaire de A à Z.
//           </p>
//         </div>

//         <div className="feature-item">
//           <h3>3. Traçabilité des Emballages de Production</h3>
//           {/* Icône de traçabilité ici */}
//           <p>
//             La traçabilité est un pilier de la sécurité alimentaire. Grâce à la prise de visuel de vos emballages de production, notre API vous aide à résoudre les soucis de traçabilité, assurant un suivi impeccable de chaque lot et une réponse rapide en cas de besoin.
//           </p>
//         </div>

//         <div className="feature-item">
//           <h3>4. Règles et Réglementations Toujours à Jour</h3>
//           {/* Icône de réglementation ici */}
//           <p>
//             Restez informé des dernières normes ! Notre API intègre les règles d'hygiène et de sécurité propres à la restauration. Cela vous permet de mieux appréhender les attentes des contrôleurs d'hygiène et de sécurité, et d'être toujours en conformité.
//           </p>
//         </div>

//         <div className="feature-item">
//           <h3>5. Accès Facile aux Documents Légaux</h3>
//           {/* Icône de document ici */}
//           <p>
//             Imaginez avoir tous vos documents légaux (autorisations, certificats, registres) disponibles et à jour, accessibles instantanément en cas de contrôle. Notre API vous permet de stocker et de gérer ces documents essentiels, vous offrant une tranquillité d'esprit inégalée.
//           </p>
//         </div>
//       </section>

//       <hr /> {/* Ligne de séparation */}

//       <section className="promise-section">
//         <h2>Notre Promesse : La Sérénité au Quotidien</h2>
//         <p>
//           L'objectif de {apiName} est clair : vous permettre d'être **prêt à tout moment** à passer un contrôle sanitaire ou de sécurité, sans stress ni imprévu. Concentrez-vous sur ce que vous faites de mieux : ravir vos clients, pendant que nous veillons sur votre conformité.
//         </p>
//       </section>

//       <footer className="call-to-action-footer">
//         <h2>Prêt à Transformer votre Gestion ?</h2>
//         <div className="action-buttons">
//           <button className="cta-button"><a href="#">Contactez-nous</a></button>
//           {/* <button className="cta-button">Demandez une démo</button> */}
//           {/* <button className="cta-button">Accédez à la documentation API</button> */}
//         </div>
//       </footer>
//     </div>
//   );
// }

// export default HomePage;