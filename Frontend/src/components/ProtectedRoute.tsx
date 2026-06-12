import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Check if we have tokens in localStorage
  const hasTokens = api.isLoggedIn();

  // Show loading while fetching user data
  if (isLoading && !user && !hasTokens) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we have tokens but no user yet, show loading (user data is being fetched)
  if (hasTokens && !user && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No tokens or user - redirect to login
  if (!hasTokens && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User exists but not admin for admin-only routes
  if (adminOnly && user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
