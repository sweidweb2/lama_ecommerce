'use client';

import { supabase } from '@/lib/supabase/client';

export default function TestRegister() {
  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email: 'helepinostar2022@gmail.com',
      password: 'Password123!',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback',
        data: {
          full_name: 'Aiden Weidman',
          role: 'admin',
        },
      },
    });

    console.log(error ?? 'Signup success');
  };

  return <button onClick={handleRegister}>Test Register</button>;
}
