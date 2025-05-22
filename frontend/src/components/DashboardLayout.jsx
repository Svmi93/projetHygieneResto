// frontend/src/components/DashboardLayout.jsx
import React, { useState } from 'react';
import Modal from './Modal'; // Importez le composant Modal
import '../pages/DashboardLayout.css'; // Assurez-vous que ce CSS est bien lié

const DashboardLayout = ({ sidebarButtons, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState('');

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

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        {sidebarButtons.map((button, index) => (
          <button
            key={index}
            className="sidebar-button"
            onClick={() => openModal(button.content, button.title)}
          >
            {button.label}
          </button>
        ))}
      </aside>
      <main className="main-content">
        {children} {/* Le contenu principal du tableau de bord (par exemple, un aperçu) */}
      </main>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
        {modalContent}
      </Modal>
    </div>
  );
};

export default DashboardLayout;
