import { createContext, useContext, useEffect, useState } from 'react';

const UserStylesContext = createContext();

export function UserStylesProvider({ children }) {
  const [authorStyles, setAuthorStyles] = useState([]);
  const [bookStyles, setBookStyles] = useState([]);

  useEffect(() => {
    async function fetchStyles() {
      try {
        const authorRes = await fetch('/api/user/authorstyle');
        const bookRes = await fetch('/api/user/bookstyle');

        if (!authorRes.ok || !bookRes.ok)
          throw new Error('Failed to load styles');

        setAuthorStyles(await authorRes.json());
        setBookStyles(await bookRes.json());
      } catch (error) {
        console.error('❌ Error fetching styles:', error);
      }
    }

    fetchStyles();
  }, []);

  return (
    <UserStylesContext.Provider value={{ authorStyles, bookStyles }}>
      {children}
    </UserStylesContext.Provider>
  );
}

export function useUserStyles() {
  return useContext(UserStylesContext);
}
