/**
 * Mock Authentication Handler
 * 
 * Accepts demo credentials and returns mock user objects.
 * No real authentication — purely client-side.
 */

export interface MockUser {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'teacher' | 'parent' | 'tu';
  photo?: string | null;
}

export const mockUsers: Record<string, { password: string; user: MockUser }> = {
  admin: {
    password: 'demo1234',
    user: { id: 1, name: 'Administrator', username: 'admin', role: 'admin', photo: null },
  },
  teacher1: {
    password: 'demo1234',
    user: { id: 2, name: 'Siti Rahmawati, S.Pd.', username: 'teacher1', role: 'teacher', photo: null },
  },
  discipline1: {
    password: 'demo1234',
    user: { id: 3, name: 'Budi Hartono, S.Pd.I.', username: 'discipline1', role: 'teacher', photo: null },
  },
  parent1: {
    password: 'demo1234',
    user: { id: 4, name: 'Wali dari Keisha', username: 'parent1', role: 'parent', photo: null },
  },
  tu1: {
    password: 'demo1234',
    user: { id: 5, name: 'Eko Prasetyo, S.E.', username: 'tu1', role: 'tu', photo: null },
  },
};

export function authenticateUser(username: string, password: string): { success: boolean; user?: MockUser; token?: string; error?: string } {
  const entry = mockUsers[username.toLowerCase()];
  
  if (!entry) {
    return { success: false, error: 'Username not found. Try: admin, teacher1, discipline1, parent1, or tu1' };
  }
  
  if (entry.password !== password) {
    return { success: false, error: 'Wrong password. Use: demo1234' };
  }
  
  return {
    success: true,
    user: entry.user,
    token: `demo_token_${entry.user.role}_${Date.now()}`,
  };
}
