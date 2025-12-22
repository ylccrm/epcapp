import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');
  const { user } = useAuth();

  useEffect(() => {
    loadLanguagePreference();
  }, [user]);

  const loadLanguagePreference = async () => {
    if (!user) {
      const savedLang = localStorage.getItem('language') as Language;
      if (savedLang) {
        setLanguageState(savedLang);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('user_id', user.id)
        .eq('setting_key', 'language')
        .maybeSingle();

      if (!error && data) {
        setLanguageState(data.setting_value as Language);
      } else {
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang) {
          setLanguageState(savedLang);
        }
      }
    } catch (err) {
      console.error('Error loading language preference:', err);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);

    if (user) {
      try {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            user_id: user.id,
            setting_key: 'language',
            setting_value: lang,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,setting_key'
          });

        if (error) {
          console.error('Error saving language preference:', error);
        }
      } catch (err) {
        console.error('Error saving language preference:', err);
      }
    }
  };

  const t = (key: string): string => {
    const translations = language === 'es' ? translationsES : translationsEN;
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

const translationsES = {
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    view: 'Ver',
    add: 'Agregar',
    close: 'Cerrar',
    search: 'Buscar',
    filter: 'Filtrar',
    upload: 'Subir',
    download: 'Descargar',
    loading: 'Cargando',
    error: 'Error',
    success: 'Éxito',
    confirm: 'Confirmar',
    actions: 'Acciones',
    status: 'Estado',
    date: 'Fecha',
    name: 'Nombre',
    email: 'Correo',
    role: 'Rol',
    description: 'Descripción',
    noData: 'No hay datos disponibles',
    yes: 'Sí',
    no: 'No',
    expand: 'Expandir',
    collapse: 'Colapsar'
  },
  auth: {
    signIn: 'Iniciar Sesión',
    signInWithGoogle: 'Iniciar sesión con Google',
    signOut: 'Cerrar Sesión',
    welcome: 'Bienvenido',
    signInDescription: 'Sistema de gestión de proyectos solares EPC'
  },
  nav: {
    dashboard: 'Dashboard',
    projects: 'Proyectos',
    inventory: 'Inventario',
    suppliers: 'Proveedores',
    users: 'Usuarios'
  },
  dashboard: {
    title: 'Dashboard',
    overview: 'Resumen General',
    totalProjects: 'Proyectos Totales',
    activeProjects: 'Proyectos Activos',
    completedProjects: 'Proyectos Completados',
    totalRevenue: 'Ingresos Totales',
    inventoryValue: 'Valor del Inventario',
    recentActivity: 'Actividad Reciente',
    projectProgress: 'Progreso de Proyectos'
  },
  projects: {
    title: 'Proyectos',
    newProject: 'Nuevo Proyecto',
    allProjects: 'Todos los Proyectos',
    myProjects: 'Mis Proyectos',
    sharedProjects: 'Proyectos Compartidos',
    projectName: 'Nombre del Proyecto',
    location: 'Ubicación',
    capacity: 'Capacidad',
    progress: 'Progreso',
    startDate: 'Fecha de Inicio',
    endDate: 'Fecha de Fin',
    details: 'Detalles',
    contracts: 'Contratos',
    milestones: 'Hitos',
    equipment: 'Equipos',
    materials: 'Materiales',
    crews: 'Cuadrillas',
    docs: 'Documentos',
    payments: 'Pagos',
    share: 'Compartir'
  },
  inventory: {
    title: 'Inventario',
    newItem: 'Nuevo Item',
    itemName: 'Nombre del Item',
    sku: 'SKU',
    category: 'Categoría',
    quantity: 'Cantidad',
    unit: 'Unidad',
    location: 'Ubicación',
    minStock: 'Stock Mínimo',
    unitCost: 'Costo Unitario',
    totalValue: 'Valor Total',
    supplier: 'Proveedor',
    lowStock: 'Stock Bajo'
  },
  suppliers: {
    title: 'Proveedores',
    newSupplier: 'Nuevo Proveedor',
    supplierName: 'Nombre del Proveedor',
    contact: 'Contacto',
    phone: 'Teléfono',
    address: 'Dirección',
    rating: 'Calificación',
    activeOrders: 'Órdenes Activas'
  },
  users: {
    title: 'Usuarios',
    newUser: 'Nuevo Usuario',
    fullName: 'Nombre Completo',
    active: 'Activo',
    inactive: 'Inactivo',
    lastLogin: 'Último Acceso',
    createdAt: 'Creado',
    roles: {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      installer: 'Instalador'
    }
  },
  settings: {
    title: 'Configuración',
    language: 'Idioma',
    spanish: 'Español',
    english: 'Inglés',
    selectLanguage: 'Seleccionar idioma'
  }
};

const translationsEN = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    add: 'Add',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    upload: 'Upload',
    download: 'Download',
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    description: 'Description',
    noData: 'No data available',
    yes: 'Yes',
    no: 'No',
    expand: 'Expand',
    collapse: 'Collapse'
  },
  auth: {
    signIn: 'Sign In',
    signInWithGoogle: 'Sign in with Google',
    signOut: 'Sign Out',
    welcome: 'Welcome',
    signInDescription: 'Solar EPC Project Management System'
  },
  nav: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    inventory: 'Inventory',
    suppliers: 'Suppliers',
    users: 'Users'
  },
  dashboard: {
    title: 'Dashboard',
    overview: 'Overview',
    totalProjects: 'Total Projects',
    activeProjects: 'Active Projects',
    completedProjects: 'Completed Projects',
    totalRevenue: 'Total Revenue',
    inventoryValue: 'Inventory Value',
    recentActivity: 'Recent Activity',
    projectProgress: 'Project Progress'
  },
  projects: {
    title: 'Projects',
    newProject: 'New Project',
    allProjects: 'All Projects',
    myProjects: 'My Projects',
    sharedProjects: 'Shared Projects',
    projectName: 'Project Name',
    location: 'Location',
    capacity: 'Capacity',
    progress: 'Progress',
    startDate: 'Start Date',
    endDate: 'End Date',
    details: 'Details',
    contracts: 'Contracts',
    milestones: 'Milestones',
    equipment: 'Equipment',
    materials: 'Materials',
    crews: 'Crews',
    docs: 'Documents',
    payments: 'Payments',
    share: 'Share'
  },
  inventory: {
    title: 'Inventory',
    newItem: 'New Item',
    itemName: 'Item Name',
    sku: 'SKU',
    category: 'Category',
    quantity: 'Quantity',
    unit: 'Unit',
    location: 'Location',
    minStock: 'Min Stock',
    unitCost: 'Unit Cost',
    totalValue: 'Total Value',
    supplier: 'Supplier',
    lowStock: 'Low Stock'
  },
  suppliers: {
    title: 'Suppliers',
    newSupplier: 'New Supplier',
    supplierName: 'Supplier Name',
    contact: 'Contact',
    phone: 'Phone',
    address: 'Address',
    rating: 'Rating',
    activeOrders: 'Active Orders'
  },
  users: {
    title: 'Users',
    newUser: 'New User',
    fullName: 'Full Name',
    active: 'Active',
    inactive: 'Inactive',
    lastLogin: 'Last Login',
    createdAt: 'Created',
    roles: {
      admin: 'Administrator',
      supervisor: 'Supervisor',
      installer: 'Installer'
    }
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    spanish: 'Spanish',
    english: 'English',
    selectLanguage: 'Select language'
  }
};
