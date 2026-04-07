import { supabase } from '@/lib/supabase';

export function useAuth() {
  const signUp = async (email: string, password: string, nome: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { signUp, signIn, signOut };
}
