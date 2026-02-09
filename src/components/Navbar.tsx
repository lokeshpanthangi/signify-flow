import { FileSignature } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <FileSignature className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold text-foreground">SignFlow</span>
        </Link>
        <div>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm">Login / Sign Up</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
