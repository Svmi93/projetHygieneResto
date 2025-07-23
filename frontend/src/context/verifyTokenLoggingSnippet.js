const verifyToken = useCallback(async () => {
  const currentToken = localStorage.getItem('userToken');
  console.log("AuthContext: Token actuel dans localStorage:", currentToken);
  if (!currentToken) {
    setUser(null);
    setIsLoading(false);
    return false;
  }

  try {
    console.log("AuthContext: Envoi de la requête verifyToken avec token:", currentToken);
    const userData = await AuthService.verifyToken();

    console.log('AuthContext: Données utilisateur reçues après vérification du token:', userData);

    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setToken(currentToken);
    setError(null);
    console.log('Token vérifié avec succès. Utilisateur connecté:', userData.email);
    return true;
  } catch (err) {
    console.error('Erreur lors de la vérification du token:', err);
    if (err.response) {
      console.error('Détails de la réponse d\'erreur:', err.response.data);
    }
    setError(err.response?.data?.message || 'Erreur lors de la vérification de la session.');
    logout();
    return false;
  } finally {
    setIsLoading(false);
  }
}, [logout]);
