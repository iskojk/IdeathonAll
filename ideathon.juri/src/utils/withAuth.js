import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const withAuth = (WrappedComponent, excludeRoutes = []) => {
    const AuthenticatedComponent = (props) => {
      const router = useRouter();
      const { isAuthenticated } = useSelector((state) => state.auth);
  
      useEffect(() => {
        const publicRoutes = ["/auth/login", "/auth/register", ...excludeRoutes];
        const currentRoute = router.pathname;
  
        if (!isAuthenticated && !publicRoutes.includes(currentRoute)) {
          router.push("/auth/login");
        }
      }, [isAuthenticated, router]);
  
      if (!isAuthenticated) {
        return null;
      }
  
      return <WrappedComponent {...props} />;
    };
  
    return AuthenticatedComponent;
  };
  

export default withAuth;
