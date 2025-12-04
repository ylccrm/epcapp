import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'USD' | 'COP';

interface CurrencyContextType {
  currency: Currency;
  exchangeRate: number;
  setCurrency: (currency: Currency) => void;
  formatAmount: (usdAmount: number) => string;
  setExchangeRate: (rate: number) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [exchangeRate, setExchangeRate] = useState(4000);

  const formatAmount = (usdAmount: number): string => {
    if (currency === 'COP') {
      const copAmount = usdAmount * exchangeRate;
      return `$ ${copAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `$ ${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, exchangeRate, setCurrency, formatAmount, setExchangeRate }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
