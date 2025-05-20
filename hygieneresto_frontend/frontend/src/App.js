import React from 'react';
import RegisterPage from './components/RegisterPage'; // Ajustez le chemin si nécessaire
//import 'app.css'; // Si vous avez des styles globaux

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Bienvenue sur HygièneResto</h1>
      </header>
      <main>
        <RegisterPage /> 
      </main>
    </div>
  );
}

export default App;
