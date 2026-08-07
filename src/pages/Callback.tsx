import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';

export default function CallbackPage() {
  const { isAuthenticated, isLoading } = useKindeAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // After successful authentication, go to onboarding to check profile
      navigate('/onboarding');
    } else if (!isLoading && !isAuthenticated) {
      // Something went wrong, redirect to login
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Completing login...</div>;
}