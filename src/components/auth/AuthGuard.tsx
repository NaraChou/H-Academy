import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'staff' | 'student')[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthorized(false);
        return;
      }

      // 檢查用戶角色
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      const role = profile?.role || 'student'; // 預設為 student，視資料庫而定

      if (allowedRoles.includes(role)) {
        setIsAuthorized(true);
      } else {
        // 權限不符，登出並重定向
        alert('權限不足，請由正確入口登入');
        await supabase.auth.signOut();
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, [allowedRoles]);

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full">
        <Loader2 className="animate-spin text-[var(--brand-primary)]" size={32} />
      </div>
    );
  }

  if (isAuthorized === false) {
    // 依據原本入口動向重設
    const isStaffPath = location.pathname.startsWith('/staff');
    const loginPath = isStaffPath ? '/staff/login' : '/student/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
