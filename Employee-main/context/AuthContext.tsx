import React, { createContext, useContext } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();

  const user: UserProfile | null = clerkUser
    ? {
        userId: clerkUser.id,
        name: clerkUser.fullName || `${clerkUser.firstName} ${clerkUser.lastName}`,
        phone: clerkUser.primaryPhoneNumber?.phoneNumber || '',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        role: (clerkUser.publicMetadata?.role as string) || 'employee',
        employeeId: (clerkUser.publicMetadata?.employeeId as string) || 'EMP-0000',
        department: (clerkUser.publicMetadata?.department as string) || 'General',
        profilePicUrl: clerkUser.imageUrl,
      }
    : null;

  const logout = async () => {
    await signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading: !isLoaded, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

