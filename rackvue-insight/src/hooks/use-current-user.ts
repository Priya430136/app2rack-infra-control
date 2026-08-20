import { useEffect, useState } from "react";
import api from "@/lib/api";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const token = localStorage.getItem('token');
      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        if (!active) return;
        
        const userData = data.data;
        setUser({
          id: userData.id,
          email: userData.email,
          displayName: userData.display_name || userData.email.split("@")[0],
          avatarUrl: userData.avatar_url || null,
        });
      } catch (err) {
        if (active) {
          setUser(null);
          localStorage.removeItem('token');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    
    load();
    
    // Listen for storage changes (for logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      active = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { user, loading };
}
