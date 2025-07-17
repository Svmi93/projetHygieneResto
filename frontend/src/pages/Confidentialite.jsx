
import React from 'react';
// Assurez-vous que 'confidentialite.css' se trouve dans le MÊME répertoire que ce fichier Confidentialite.jsx
import './Confidentialite.css'; 

const Confidentialite = () => {
    return (
        <main className="container py-8">
            <h1 className="text-4xl mb-6 text-center text-blue-800 font-bold">Avis de confidentialité</h1>

            <section className="mb-8 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl mb-4 text-blue-700 font-semibold">Introduction</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                    Votre Application d'Hygiène et Sécurité Alimentaire s’engage à respecter votre vie privée et à protéger vos données personnelles.
                    Cet avis de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre application.
                </p>
                <p className="mb-4 text-gray-700 leading-relaxed">
                    Conformément à la Législation applicable en matière de protection des données, notamment le Règlement Général sur la Protection des Données (RGPD) de l'Union Européenne,
                    nous veillons à ce que vos données soient traitées de manière licite, loyale et transparente.
                </p>
            </section>

            <section className="mb-8 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl mb-4 text-blue-700 font-semibold">Données que nous collectons</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">Nous pouvons collecter les types de données suivants lorsque vous utilisez notre application :</p>
                <ul className="list-disc list-inside ml-5 text-gray-700 leading-relaxed">
                    <li className="mb-2">
                        <strong>Données d'identification :</strong> Nom, prénom, adresse e-mail, numéro de téléphone (si fourni).
                    </li>
                    <li className="mb-2">
                        <strong>Données professionnelles :</strong> Nom de l'établissement, adresse de l'établissement, type d'établissement.
                    </li>
                    <li className="mb-2">
                        <strong>Données d'utilisation :</strong> Informations sur la manière dont vous utilisez l'application, les fonctionnalités consultées, les logs d'activité.
                    </li>
                    <li className="mb-2">
                        <strong>Données techniques :</strong> Adresse IP, type de navigateur, système d'exploitation, identifiants d'appareil.
                    </li>
                    <li className="mb-2">
                        <strong>Données relatives à l'hygiène et la sécurité alimentaire :</strong> Informations saisies par l'utilisateur concernant les contrôles, les non-conformités, les plans d'action, les températures, etc.
                    </li>
                </ul>
            </section>

            <section className="mb-8 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl mb-4 text-blue-700 font-semibold">Comment nous utilisons vos données</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">Vos données sont utilisées aux fins suivantes :</p>
                <ul className="list-disc list-inside ml-5 text-gray-700 leading-relaxed">
                    <li className="mb-2">
                        <strong>Fournir et maintenir l'application :</strong> Pour assurer le bon fonctionnement de l'application et de ses fonctionnalités.
                    </li>
                    <li className="mb-2">
                        <strong>Personnaliser votre expérience :</strong> Pour adapter l'application à vos besoins spécifiques.
                    </li>
                    <li className="mb-2">
                        <strong>Améliorer nos services :</strong> Pour analyser l'utilisation de l'application et apporter des améliorations.
                    </li>
                    <li className="mb-2">
                        <strong>Communication :</strong> Pour vous envoyer des notifications importantes, des mises à jour ou répondre à vos demandes.
                    </li>
                    <li className="mb-2">
                        <strong>Sécurité :</strong> Pour protéger l'application contre les fraudes et les accès non autorisés.
                    </li>
                    <li className="mb-2">
                        <strong>Conformité légale :</strong> Pour respecter nos obligations légales et réglementaires.
                    </li>
                </ul>
            </section>

            <section className="mb-8 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl mb-4 text-blue-700 font-semibold">Partage de vos données</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers.</p>
                <p className="mb-4 text-gray-700 leading-relaxed">Nous pouvons partager vos données avec :</p>
                <ul className="list-disc list-inside ml-5 text-gray-700 leading-relaxed">
                    <li className="mb-2">
                        <strong>Fournisseurs de services tiers :</strong> Des entreprises qui nous aident à exploiter l'application (hébergement, analyse de données, support technique). Ces tiers sont contractuellement tenus de protéger vos données et de ne les utiliser que pour les services qu'ils nous fournissent.
                    </li>
                    <li className="mb-2">
                        <strong>Autorités légales :</strong> Si la loi l'exige ou si nous pensons de bonne foi qu'une telle action est nécessaire pour se conformer à une obligation légale, protéger nos droits ou notre propriété, ou assurer la sécurité de nos utilisateurs.
                    </li>
                </ul>
            </section>

            <section className="mb-8 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl mb-4 text-blue-700 font-semibold">Sécurité des données</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                    Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre l'accès non autorisé, la divulgation, l'altération ou la destruction.
                    Cela inclut le chiffrement des données, des contrôles d'accès stricts et des audits de sécurité réguliers.
                </p>
            </section>

            <section className="mb-8 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl mb-4 text-blue-700 font-semibold">Vos droits</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :</p>
                <ul className="list-disc list-inside ml-5 text-gray-700 leading-relaxed">
                    <li className="mb-2">
                        <strong>Droit d'accès :</strong> Obtenir la confirmation que vos données sont traitées et en obtenir une copie.
                    </li>
                    <li className="mb-2">
                        <strong>Droit de rectification :</strong> Demander la correction de données inexactes ou incomplètes.
                    </li>
                    <li className="mb-2">
                        <strong>Droit à l'effacement ("droit à l'oubli") :</strong> Demander la suppression de vos données dans certaines conditions.
                    </li>
                    <li className="mb-2">
                        <strong>Droit à la limitation du traitement :</strong> Demander la limitation du traitement de vos données.
                    </li>
                    <li className="mb-2">
                        <strong>Droit à la portabilité des données :</strong> Recevoir vos données dans un format structuré, couramment utilisé et lisible par machine.
                    </li>
                    <li className="mb-2">
                        <strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données pour des raisons légitimes.
                    </li>
                    <li className="mb-2">
                        <strong>Droit de retirer votre consentement :</strong> Retirer votre consentement à tout moment, sans affecter la légalité du traitement basé sur le consentement avant son retrait.
                    </li>
                    <li className="mb-2">
                        <strong>Droit d'introduire une réclamation :</strong> Déposer une plainte auprès d'une organisme de contrôle (par exemple, la CNIL en France).
                    </li>
                </ul>
                <p className="mt-4 text-gray-700 leading-relaxed">
                    Pour exercer ces droits, veuillez nous contacter à l'adresse indiquée dans la section "Nous contacter".
                </p>
            </section>

            <section className="mb-8 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl mb-4 text-blue-700 font-semibold">Conservation des données</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                    Nous conservons vos données personnelles aussi longtemps que nécessaire pour les finalités pour lesquelles elles ont été collectées,
                    y compris pour satisfaire à toute exigence légale, comptable ou de reporting.
                </p>
            </section>

            <section className="mb-8 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl mb-4 text-blue-700 font-semibold">Modifications de cet avis de confidentialité</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                    Nous pouvons mettre à jour notre avis de confidentialité de temps à autre. Nous vous informerons de tout changement en publiant le nouvel avis de confidentialité sur cette page.
                    Nous vous conseillons de consulter cet avis de confidentialité périodiquement pour prendre connaissance de toute modification.
                </p>
            </section>

            <section className="p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl mb-4 text-blue-700 font-semibold">Nous contacter</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                    Si vous avez des questions concernant cet avis de confidentialité ou nos pratiques en matière de données, veuillez nous contacter à :
                </p>
                <p className="font-semibold text-gray-800">
                    Email : <a href="mailto:contact@votreapplication.com" className="text-blue-600 hover:underline">contact@votreapplication.com</a>
                </p>
                <p className="font-semibold text-gray-800">
                    Adresse : [Votre adresse physique, si applicable]
                </p>
            </section>
        </main>
    );
};

export default Confidentialite;
