'use client';

import { supabase } from '@/lib/supabase/client';

export default function TestRegister() {
  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email: 'asweid657@gmail.com',
      password: 'Password123!',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    });

    console.log(error ?? 'Signup success');
  };

  return <button onClick={handleRegister}>Test Register</button>;
}
