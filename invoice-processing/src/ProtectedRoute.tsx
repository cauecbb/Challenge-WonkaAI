import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Center, Spinner, Text, Flex } from '@chakra-ui/react';
import { useAuth } from './contexts/AuthContext';

const ALLOWED_DOMAINS = ['meetwonka.com', 'amnorman.be'];

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <Center width="100%" height="100vh">
        <Flex direction="column" align="center" gap={4}>
          <Spinner size="xl" color="#0066cc" />
          <Text>Loading...</Text>
        </Flex>
      </Center>
    );
  }

  // If not authenticated or no user object, redirect to landing page
  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check domain validation using the user email from our backend
  const domain = user.email.split('@')[1] || '';
  const isAllowedDomain = ALLOWED_DOMAINS.includes(domain);

  if (!isAllowedDomain) {
    // If not an allowed domain, redirect to landing page
    return <Navigate to="/" state={{ from: location, error: "Domain not authorized." }} replace />;
  }

  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/dashboard"
        state={{ from: location, error: "You do not have permission to access this page." }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute; 