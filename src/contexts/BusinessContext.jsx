import React, { createContext, useContext, useState, useEffect } from 'react';
import { Business } from '../api/entities';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const data = await Business.list();
      setBusinesses(data);
      if (data.length > 0) {
        const stored = localStorage.getItem('currentBusinessId');
        const found = stored ? data.find(b => b.id === stored) : null;
        setCurrentBusiness(found || data[0]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const switchBusiness = (business) => {
    setCurrentBusiness(business);
    localStorage.setItem('currentBusinessId', business.id);
  };

  const refreshBusiness = async () => {
    await loadBusinesses();
  };

  return (
    <BusinessContext.Provider value={{ currentBusiness, businesses, loading, switchBusiness, refreshBusiness, setCurrentBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);
