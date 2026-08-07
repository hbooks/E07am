import { useEffect, useState } from 'react';
import { getKinde } from '../utils/kinde';
import type { KindeClient } from '@kinde-oss/kinde-auth-pkce-js';

interface KindeUser {
  id: string;
  email: string;
  given_name?: string;
  family_name?: string;
}

export function useKindeAuth() {
  const [kindeClient, setKindeClient] = useState<KindeClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<KindeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialise the Kinde client
  useEffect(() => {
    getKinde().then(setKindeClient);
  }, []);

  // Once client is ready, check auth and get user
  useEffect(() => {
    if (!kindeClient) return;

    kindeClient.isAuthenticated().then((authenticated: boolean) => {
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const currentUser = kindeClient.getUser();
        setUser(currentUser as KindeUser);
      }
      setIsLoading(false);
    });
  }, [kindeClient]);

  const login = () => kindeClient?.login();
  const logout = () => kindeClient?.logout();
  const getToken = () => kindeClient?.getToken();

  return { isAuthenticated, isLoading, user, login, logout, getToken };
}