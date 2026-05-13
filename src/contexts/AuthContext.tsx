import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

type AccountStatus = 'active' | 'suspended' | 'blocked';

interface AppUser extends User {
  status?: AccountStatus;
  blocked?: boolean;
  blockedReason?: string | null;
  suspendedUntil?: string | null;
  suspendedReason?: string | null;
}

interface LoginResult {
  success: boolean;
  message?: string;
  reason?: string | null;
  status?: AccountStatus;
  suspendedUntil?: string | null;
  user?: AppUser;
}

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithDetails: (email: string, password: string) => Promise<LoginResult>;
  signup: (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  refreshCurrentUser: (userId?: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const mapDbUserToAppUser = (data: any): AppUser => {
  const fullName = data?.full_name || '';
  const nameParts = fullName.trim().split(' ').filter(Boolean);

  return {
    id: data.id,
    email: data.email || '',
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    phone: data.phone || '',
    dateOfBirth: data.date_of_birth || '',
    nationality: data.nationality || '',
    passportNumber: data.passport_number || '',
    profilePicture: data.profile_picture || '',
    createdAt: data.created_at,
    status: resolveDbStatus(data),
    blocked: Boolean(data.blocked),
    blockedReason: data.blocked_reason || null,
    suspendedUntil: data.suspended_until || null,
    suspendedReason: data.suspended_reason || null,
  };
};

const resolveDbStatus = (data: any): AccountStatus => {
  if (data?.blocked) return 'blocked';

  if (data?.suspended_until) {
    const suspendedUntilTime = new Date(data.suspended_until).getTime();
    if (!Number.isNaN(suspendedUntilTime) && suspendedUntilTime > Date.now()) {
      return 'suspended';
    }
  }

  if (data?.status === 'blocked') return 'blocked';
  if (data?.status === 'suspended') return 'suspended';

  return 'active';
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('userId');
  }, []);

  const normalizeUserRecord = useCallback(async (dbUser: any) => {
    const resolvedStatus = resolveDbStatus(dbUser);
    const updates: Record<string, any> = {};
    let shouldUpdate = false;

    const suspensionExpired =
      dbUser?.suspended_until &&
      !Number.isNaN(new Date(dbUser.suspended_until).getTime()) &&
      new Date(dbUser.suspended_until).getTime() <= Date.now();

    if (suspensionExpired) {
      updates.suspended_until = null;
      updates.suspended_reason = null;
      updates.status = dbUser?.blocked ? 'blocked' : 'active';
      shouldUpdate = true;
    } else if (dbUser?.status !== resolvedStatus) {
      updates.status = resolvedStatus;
      shouldUpdate = true;
    }

    if (!shouldUpdate) return dbUser;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbUser.id)
      .select('*')
      .single();

    if (error || !updatedUser) {
      return dbUser;
    }

    return updatedUser;
  }, []);

  const refreshCurrentUser = useCallback(
    async (userId?: string) => {
      const targetUserId = userId || localStorage.getItem('userId');

      if (!targetUserId) {
        setUser(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', targetUserId)
          .eq('role', 'user')
          .single();

        if (error || !data) {
          logout();
          return;
        }

        const normalized = await normalizeUserRecord(data);
        const resolvedStatus = resolveDbStatus(normalized);

        if (resolvedStatus === 'blocked') {
          logout();
          return;
        }

        setUser(mapDbUserToAppUser(normalized));
      } catch (error) {
        console.error('Refresh current user error:', error);
        logout();
      }
    },
    [logout, normalizeUserRecord]
  );

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshCurrentUser();
      setIsLoading(false);
    };

    init();
  }, [refreshCurrentUser]);

  const loginWithDetails = async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);

    try {
      const normalizedEmail = email.trim();

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
       
        .eq('role', 'user')
        .maybeSingle();

      if (error || !userData) {
        return {
          success: false,
          message: 'Invalid email or account not found',
        };
      }

      const normalizedUser = await normalizeUserRecord(userData);
      const resolvedStatus = resolveDbStatus(normalizedUser);

      if (resolvedStatus === 'blocked') {
        return {
          success: false,
          status: 'blocked',
          message: 'Your account has been blocked by admin.',
          reason: normalizedUser.blocked_reason || null,
        };
      }

      if (resolvedStatus === 'suspended') {
        return {
          success: false,
          status: 'suspended',
          message: 'Your account is temporarily suspended.',
          reason: normalizedUser.suspended_reason || null,
          suspendedUntil: normalizedUser.suspended_until || null,
        };
      }

      const mappedUser = mapDbUserToAppUser({
        ...normalizedUser,
        status: 'active',
      });

      await supabase
        .from('users')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', normalizedUser.id);

      setUser(mappedUser);
      localStorage.setItem('userId', normalizedUser.id);

      return {
        success: true,
        status: 'active',
        user: mappedUser,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await loginWithDetails(email, password);
    return result.success;
  };

  const signup = async (
    userData: Omit<User, 'id' | 'createdAt'> & { password: string }
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email.trim())
        .maybeSingle();

      if (existingUser) {
        return false;
      }

      const fullName = `${userData.firstName} ${userData.lastName}`.trim();

      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            email: userData.email.trim(),
            full_name: fullName,
            phone: userData.phone,
            date_of_birth: userData.dateOfBirth || null,
            nationality: userData.nationality || null,
            passport_number: userData.passportNumber || null,
            profile_picture: userData.profilePicture || null,
            role: 'user',
            status: 'active',
            blocked: false,
            blocked_reason: null,
            suspended_until: null,
            suspended_reason: null,
          },
        ])
        .select('*')
        .single();

      if (error || !newUser) {
        console.error('Signup error:', error);
        return false;
      }

      const mappedUser = mapDbUserToAppUser(newUser);
      setUser(mappedUser);
      localStorage.setItem('userId', newUser.id);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      const updates: Record<string, any> = {};

      const nextFirstName = userData.firstName ?? user.firstName;
      const nextLastName = userData.lastName ?? user.lastName;

      if (userData.firstName !== undefined || userData.lastName !== undefined) {
        updates.full_name = `${nextFirstName} ${nextLastName}`.trim();
      }

      if (userData.email !== undefined) updates.email = userData.email.trim();
      if (userData.phone !== undefined) updates.phone = userData.phone.trim();
      if (userData.dateOfBirth !== undefined) updates.date_of_birth = userData.dateOfBirth || null;
      if (userData.nationality !== undefined) updates.nationality = userData.nationality || null;
      if (userData.passportNumber !== undefined) updates.passport_number = userData.passportNumber || null;
      if (userData.profilePicture !== undefined) updates.profile_picture = userData.profilePicture || null;

      updates.updated_at = new Date().toISOString();

      const { error } = await supabase.from('users').update(updates).eq('id', user.id);

      if (error) {
        console.error('Update profile error:', error);
        return false;
      }

      await refreshCurrentUser(user.id);
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    loginWithDetails,
    signup,
    logout,
    updateProfile,
    refreshCurrentUser,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};