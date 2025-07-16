
// frontend/src/components/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import Modal from './Modal'; // Importez le composant Modal
import './DashboardLayout.css'; // Chemin corrigé : le fichier CSS est dans le même dossier

const DashboardLayout = ({ sidebarButtons, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState('');

  // activeMainContent affichera le contenu du bouton de la sidebar sélectionné
  const [activeMainContent, setActiveMainContent] = useState(null);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState(0);

  // EFFET POUR DÉFINIR LE CONTENU PAR DÉFAUT AU CHARGEMENT
  useEffect(() => {
    // Si des boutons de sidebar sont disponibles et qu'aucun contenu n'est encore actif,
    // définissez le contenu du premier bouton comme contenu actif par défaut.
    if (Array.isArray(sidebarButtons) && sidebarButtons.length > 0 && !activeMainContent) {
      console.log("DashboardLayout: Setting default content from first sidebar button.");
      setActiveMainContent(sidebarButtons[0].content);
      setSelectedButtonIndex(0);
    } else if (!Array.isArray(sidebarButtons) || sidebarButtons.length === 0) {
      console.log("DashboardLayout: No sidebar buttons available. Resetting activeMainContent.");
      setActiveMainContent(null);
      setSelectedButtonIndex(-1);
    }
  }, [sidebarButtons, activeMainContent]); // Dépend de sidebarButtons et activeMainContent pour s'initialiser

  const openModal = (content, title) => {
    setModalContent(content);
    setModalTitle(title);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setModalTitle('');
  };

  const handleSidebarButtonClick = (buttonContent, buttonTitle, index) => {
    console.log(`DashboardLayout: Sidebar button clicked - ${buttonTitle}`);
    setActiveMainContent(buttonContent); // Met à jour le contenu affiché dans la zone principale
    setSelectedButtonIndex(index);      // Met à jour l'index du bouton sélectionné pour le style
    // Optionnel: ouvrir la modale avec le même contenu si vous voulez que chaque clic ouvre une modale
    // openModal(buttonContent, buttonTitle);
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="text-2xl font-bold mb-8 text-center">HygienePro</div>
        <nav className="flex-1 space-y-2">
          {Array.isArray(sidebarButtons) && sidebarButtons.map((button, index) => (
            <button
              key={index}
              className={`sidebar-button ${selectedButtonIndex === index ? 'active' : ''}`}
              onClick={() => handleSidebarButtonClick(button.content, button.title, index)}
            >
              {button.label}
            </button>
          ))}
          {(!Array.isArray(sidebarButtons) || sidebarButtons.length === 0) && (
            <div className="text-center text-gray-400 mt-4">Aucun bouton de barre latérale.</div>
          )}
        </nav>
        {/* Section pour le pied de page de la barre latérale */}
        <div className="mt-auto pt-4 border-t border-gray-700 text-sm text-gray-400 text-center">
          © 2024 HygienePro
        </div>
      </aside>
      <main className="main-content">
        <header className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-600">Gérez efficacement votre établissement.</p>
        </header>

        <div className="dashboard-content-area">
          {/* Affiche le contenu passé via les props children (le message de bienvenue) */}
          {children}
          {/* Affiche le contenu dynamique sélectionné via les boutons de la sidebar */}
          {activeMainContent || (
            <div className="default-dashboard-message">
              Bienvenue! Veuillez sélectionner une option de tableau de bord.
            </div>
          )}
        </div>
      </main>

      {/* La modale est toujours rendue mais sa visibilité est contrôlée par isModalOpen */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
        {modalContent}
      </Modal>
    </div>
  );
};

export default DashboardLayout;






// // frontend/src/components/DashboardLayout.jsx
// import React, { useState, useEffect } from 'react';
// import Modal from './Modal'; // Importez le composant Modal
// import './DashboardLayout.css'; // Chemin corrigé : le fichier CSS est dans le même dossier

// const DashboardLayout = ({ sidebarButtons, children }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalContent, setModalContent] = useState(null);
//   const [modalTitle, setModalTitle] = useState('');

//   const [activeMainContent, setActiveMainContent] = useState(null);
//   const [selectedButtonIndex, setSelectedButtonIndex] = useState(0);

//   // EFFET POUR DÉFINIR LE CONTENU PAR DÉFAUT AU CHARGEMENT
//   useEffect(() => {
//     if (Array.isArray(sidebarButtons) && sidebarButtons.length > 0) {
//       setActiveMainContent(sidebarButtons[0].content);
//       setSelectedButtonIndex(0);
//     } else {
//       setActiveMainContent(null);
//       setSelectedButtonIndex(-1);
//     }
//   }, [sidebarButtons]);

//   const openModal = (content, title) => {
//     setModalContent(content);
//     setModalTitle(title);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setModalContent(null);
//     setModalTitle('');
//   };

//   const handleSidebarButtonClick = (buttonContent, buttonTitle, index) => {
//     setActiveMainContent(buttonContent); // Met à jour le contenu affiché dans la zone principale
//     setSelectedButtonIndex(index);      // Met à jour l'index du bouton sélectionné pour le style
//     openModal(buttonContent, buttonTitle); // Ouvre la modale avec le même contenu
//   };

//   return (
//     <div className="dashboard-layout">
//       <aside className="sidebar">
//         <div className="text-2xl font-bold mb-8 text-center" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center', color: 'white' }}>HygienePro</div>
//         <nav className="flex-1 space-y-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
//           {Array.isArray(sidebarButtons) && sidebarButtons.map((button, index) => (
//             <button
//               key={index}
//               className={`sidebar-button ${selectedButtonIndex === index ? 'active' : ''}`}
//               onClick={() => handleSidebarButtonClick(button.content, button.title, index)}
//             >
//               {button.label}
//             </button>
//           ))}
//           {(!Array.isArray(sidebarButtons) || sidebarButtons.length === 0) && (
//             <div style={{ color: '#9ca3af', textAlign: 'center', marginTop: '1rem' }}>Aucun bouton de barre latérale.</div>
//           )}
//         </nav>
//         {/* Section pour le pied de page de la barre latérale */}
//         <div className="mt-auto pt-4 border-t border-gray-700 text-sm text-gray-400 text-center" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #4a5568', fontSize: '0.875rem', color: '#a0aec0', textAlign: 'center' }}>
//           © 2024 HygienePro
//         </div>
//       </aside>
//       <main className="main-content">
//         <header className="bg-white p-6 rounded-lg shadow-md mb-8">
//           <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Tableau de bord</h1>
//           <p className="text-gray-600">Gérez efficacement votre établissement.</p>
//         </header>

//         <div className="dashboard-content-area">
//           {activeMainContent || (
//             <div className="default-dashboard-message" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
//               Bienvenue! Veuillez sélectionner une option de tableau de bord.
//             </div>
//           )}
//         </div>
//       </main>

//       <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
//         {modalContent}
//       </Modal>
//     </div>
//   );
// };

// export default DashboardLayout;






// // frontend/src/components/DashboardLayout.jsx
// import React, { useState, useEffect } from 'react';
// import Modal from './Modal'; // Importez le composant Modal
// import '../components/DashboardLayout'; // Assurez-vous que ce CSS est bien lié

// const DashboardLayout = ({ sidebarButtons, children }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalContent, setModalContent] = useState(null);
//   const [modalTitle, setModalTitle] = useState('');

//   const [activeMainContent, setActiveMainContent] = useState(null);
//   const [selectedButtonIndex, setSelectedButtonIndex] = useState(0);

//   // EFFET POUR DÉFINIR LE CONTENU PAR DÉFAUT AU CHARGEMENT
//   useEffect(() => {
//     console.log("DashboardLayout useEffect: sidebarButtons changed", sidebarButtons);

//     if (Array.isArray(sidebarButtons) && sidebarButtons.length > 0) {
//       console.log("Setting default content:", sidebarButtons[0].content);
//       setActiveMainContent(sidebarButtons[0].content);
//       setSelectedButtonIndex(0);
//     } else {
//       console.log("sidebarButtons is empty or not an array. Resetting activeMainContent.");
//       setActiveMainContent(null);
//       setSelectedButtonIndex(-1);
//     }
//   }, [sidebarButtons]);

//   const openModal = (content, title) => {
//     setModalContent(content);
//     setModalTitle(title);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setModalContent(null);
//     setModalTitle('');
//   };

//   const handleSidebarButtonClick = (buttonContent, buttonTitle, index) => {
//     setActiveMainContent(buttonContent); // Met à jour le contenu affiché dans la zone principale
//     setSelectedButtonIndex(index);      // Met à jour l'index du bouton sélectionné pour le style
//     openModal(buttonContent, buttonTitle); // Ouvre la modale avec le même contenu
//   };

//   return (
//     <div className="dashboard-layout"> {/* Utilisez vos classes CSS ici */}
//       <aside className="sidebar"> {/* Utilisez vos classes CSS ici */}
//         <div className="text-2xl font-bold mb-8 text-center" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center', color: 'white' }}>HygienePro</div> {/* Styles pour le logo/titre */}
//         <nav className="flex-1 space-y-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}> {/* Styles pour la navigation */}
//           {Array.isArray(sidebarButtons) && sidebarButtons.map((button, index) => (
//             <button
//               key={index}
//               className={`sidebar-button ${selectedButtonIndex === index ? 'active' : ''}`}
//               onClick={() => handleSidebarButtonClick(button.content, button.title, index)}
//             >
//               {button.label}
//             </button>
//           ))}
//           {!Array.isArray(sidebarButtons) || sidebarButtons.length === 0 && (
//             <div style={{ color: '#9ca3af', textAlign: 'center', marginTop: '1rem' }}>Aucun bouton de barre latérale.</div>
//           )}
//         </nav>
//         {/* Section pour le pied de page de la barre latérale */}
//         <div className="mt-auto pt-4 border-t border-gray-700 text-sm text-gray-400 text-center" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #4a5568', fontSize: '0.875rem', color: '#a0aec0', textAlign: 'center' }}>
//           © 2024 HygienePro
//         </div>
//       </aside>
//       <main className="main-content"> {/* Utilisez vos classes CSS ici */}
//         <header className="bg-white p-6 rounded-lg shadow-md mb-8" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
//           <h1 className="text-4xl font-extrabold text-gray-900 mb-2" style={{ fontSize: '2.25rem', fontWeight: 'extrabold', color: '#111827', marginBottom: '0.5rem' }}>Tableau de bord</h1>
//           <p className="text-gray-600" style={{ color: '#4b5563' }}>Gérez efficacement votre établissement.</p>
//         </header>

//         <div className="dashboard-content-area" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
//           {activeMainContent || (
//             <div className="default-dashboard-message" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
//               Bienvenue! Veuillez sélectionner une option de tableau de bord.
//             </div>
//           )}
//         </div>
//       </main>

//       <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
//         {modalContent}
//       </Modal>
//     </div>
//   );
// };

// export default DashboardLayout;
















// // frontend/src/components/DashboardLayout.jsx
// import React, { useState, useEffect } from 'react';
// import Modal from './Modal'; // Assurez-vous que le chemin vers votre composant Modal est correct
// import '../pages/DashboardLayout.css'; // Assurez-vous que ce CSS est bien lié

// const DashboardLayout = ({ sidebarButtons, children }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalContent, setModalContent] = useState(null);
//   const [modalTitle, setModalTitle] = useState('');

//   // NOUVEAUX ÉTATS POUR GÉRER LE CONTENU PRINCIPAL
//   // Initialise activeMainContent à null. Il sera défini dans useEffect.
//   const [activeMainContent, setActiveMainContent] = useState(null);
//   // État pour gérer le style du bouton de la barre latérale actuellement sélectionné
//   const [selectedButtonIndex, setSelectedButtonIndex] = useState(0);

//   // EFFET POUR DÉFINIR LE CONTENU PAR DÉFAUT AU CHARGEMENT OU LORSQUE sidebarButtons CHANGE
//   useEffect(() => {
//     // Affiche la valeur de sidebarButtons dans la console pour le débogage
//     console.log("DashboardLayout useEffect: sidebarButtons changed", sidebarButtons);

//     // Vérifie si sidebarButtons est un tableau et qu'il contient des éléments
//     if (Array.isArray(sidebarButtons) && sidebarButtons.length > 0) {
//       console.log("Setting default content:", sidebarButtons[0].content);
//       // Définit le contenu du premier bouton comme contenu actif par défaut dans la zone principale
//       setActiveMainContent(sidebarButtons[0].content);
//       setSelectedButtonIndex(0); // Marque le premier bouton comme sélectionné pour le style
//     } else {
//       // Si sidebarButtons est vide ou non défini, réinitialise activeMainContent
//       console.log("sidebarButtons is empty or not an array. Resetting activeMainContent.");
//       setActiveMainContent(null);
//       setSelectedButtonIndex(-1); // Aucun bouton sélectionné visuellement
//     }
//   }, [sidebarButtons]); // Re-exécute cet effet si la liste des boutons change

//   const openModal = (content, title) => {
//     setModalContent(content);
//     setModalTitle(title);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setModalContent(null);
//     setModalTitle('');
//   };

//   // GESTIONNAIRE DE CLIC POUR LES BOUTONS DE LA BARRE LATÉRALE
//   const handleSidebarButtonClick = (buttonContent, buttonTitle, index) => {
//     setActiveMainContent(buttonContent); // Met à jour le contenu affiché dans la zone principale
//     setSelectedButtonIndex(index);      // Met à jour l'index du bouton sélectionné pour le style
//     openModal(buttonContent, buttonTitle); // Ouvre la modale avec le même contenu
//   };

//   return (
//     <div className="dashboard-layout">
//       <aside className="sidebar">
//         {/* S'assure que sidebarButtons est un tableau avant de le mapper */}
//         {Array.isArray(sidebarButtons) && sidebarButtons.map((button, index) => (
//           <button
//             key={index}
//             // Applique une classe 'active' pour styliser le bouton sélectionné
//             className={`sidebar-button ${selectedButtonIndex === index ? 'active' : ''}`}
//             onClick={() => handleSidebarButtonClick(button.content, button.title, index)}
//           >
//             {button.label}
//           </button>
//         ))}
//       </aside>
//       <main className="main-content">
//         {/* Affiche le contenu actif du tableau de bord.
//             Si activeMainContent est nul, affiche un message par défaut.
//             Nous n'utilisons plus la prop 'children' pour le message de bienvenue initial ici. */}
//         {activeMainContent || (
//           <div className="default-dashboard-message">
//             Bienvenue! Veuillez sélectionner une option de tableau de bord.
//           </div>
//         )}
//       </main>

//       <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
//         {modalContent}
//       </Modal>
//     </div>
//   );
// };

// export default DashboardLayout;




// // frontend/src/components/DashboardLayout.jsx
// import React, { useState, useEffect } from 'react';
// import Modal from './Modal'; // Assurez-vous que le chemin vers votre composant Modal est correct
// import '../pages/DashboardLayout.css'; // Assurez-vous que ce CSS est bien lié

// const DashboardLayout = ({ sidebarButtons, children }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalContent, setModalContent] = useState(null);
//   const [modalTitle, setModalTitle] = useState('');

//   // --- NOUVEAUX ÉTATS POUR GÉRER LE CONTENU PRINCIPAL ---
//   const [activeMainContent, setActiveMainContent] = useState(null);
//   // État pour gérer le style du bouton de la barre latérale actuellement sélectionné
//   const [selectedButtonIndex, setSelectedButtonIndex] = useState(0);

//   // --- NOUVEL EFFET POUR DÉFINIR LE CONTENU PAR DÉFAUT AU CHARGEMENT ---
//   useEffect(() => {
//     // Si des boutons de barre latérale sont disponibles
//     if (sidebarButtons && sidebarButtons.length > 0) {
//       // Définit le contenu du premier bouton comme contenu actif par défaut dans la zone principale
//       setActiveMainContent(sidebarButtons[0].content);
//       setSelectedButtonIndex(0); // Marque le premier bouton comme sélectionné pour le style
//     }
//   }, [sidebarButtons]); // Re-exécute cet effet si la liste des boutons change

//   const openModal = (content, title) => {
//     setModalContent(content);
//     setModalTitle(title);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setModalContent(null);
//     setModalTitle('');
//   };

//   // --- GESTIONNAIRE DE CLIC POUR LES BOUTONS DE LA BARRE LATÉRALE ---
//   // Il met à jour le contenu principal ET ouvre la modale
//   const handleSidebarButtonClick = (buttonContent, buttonTitle, index) => {
//     setActiveMainContent(buttonContent); // Met à jour le contenu affiché dans la zone principale
//     setSelectedButtonIndex(index);      // Met à jour l'index du bouton sélectionné pour le style
//     openModal(buttonContent, buttonTitle); // Ouvre la modale avec le même contenu
//   };

//   return (
//     <div className="dashboard-layout">
//       <aside className="sidebar">
//         {sidebarButtons.map((button, index) => (
//           <button
//             key={index}
//             // Applique une classe 'active' pour styliser le bouton sélectionné
//             className={`sidebar-button ${selectedButtonIndex === index ? 'active' : ''}`}
//             onClick={() => handleSidebarButtonClick(button.content, button.title, index)}
//           >
//             {button.label}
//           </button>
//         ))}
//       </aside>
//       <main className="main-content">
//         {/* Affiche le contenu actif du tableau de bord.
//             Si activeMainContent est nul (ex: pas de sidebarButtons), affiche les children (le contenu de secours). */}
//         {activeMainContent ? activeMainContent : children}
//       </main>

//       <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
//         {modalContent}
//       </Modal>
//     </div>
//   );
// };

// export default DashboardLayout;