import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ProjectCurrency {
  currency: string;
  currencyCountry: string;
  exchangeRate: number;
  formatAmount: (usdAmount: number) => string;
  convertToUSD: (localAmount: number) => number;
  convertFromUSD: (usdAmount: number) => number;
  getCurrencySymbol: () => string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  COP: '$',
  EUR: '€',
  MXN: '$',
  BRL: 'R$',
  ARS: '$',
  CLP: '$',
  PEN: 'S/',
  GBP: '£',
  CAD: 'C$',
};

export function useProjectCurrency(projectId: string | null): ProjectCurrency {
  const [currency, setCurrency] = useState('USD');
  const [currencyCountry, setCurrencyCountry] = useState('United States');
  const [exchangeRate, setExchangeRate] = useState(1.0);

  useEffect(() => {
    if (projectId) {
      loadProjectCurrency(projectId);
    }
  }, [projectId]);

  async function loadProjectCurrency(id: string) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('currency, currency_country, exchange_rate')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrency(data.currency || 'USD');
        setCurrencyCountry(data.currency_country || 'United States');
        setExchangeRate(data.exchange_rate || 1.0);
      }
    } catch (error) {
      console.error('Error loading project currency:', error);
    }
  }

  const formatAmount = (usdAmount: number): string => {
    const localAmount = usdAmount * exchangeRate;
    const symbol = CURRENCY_SYMBOLS[currency] || currency;

    if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
      return `${symbol} ${localAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return `${symbol} ${localAmount.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const convertToUSD = (localAmount: number): number => {
    return localAmount / exchangeRate;
  };

  const convertFromUSD = (usdAmount: number): number => {
    return usdAmount * exchangeRate;
  };

  const getCurrencySymbol = (): string => {
    return CURRENCY_SYMBOLS[currency] || currency;
  };

  return {
    currency,
    currencyCountry,
    exchangeRate,
    formatAmount,
    convertToUSD,
    convertFromUSD,
    getCurrencySymbol,
  };
}
