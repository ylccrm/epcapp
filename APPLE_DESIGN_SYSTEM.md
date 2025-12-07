# Sistema de Diseño Apple-Style para SolarEPC

## Resumen

Se ha implementado un sistema de diseño completo inspirado en Apple manteniendo los colores corporativos (azul oscuro y amarillo/oro). El diseño es completamente responsive y funciona en desktop, tablet y móvil.

---

## 🎨 Paleta de Colores

### Colores Principales
- **Primario**: Slate-900 (#0f172a) - Azul oscuro corporativo
- **Acento**: Amber-400 (#fbbf24) - Amarillo/oro
- **Fondo**: Gray-50 (#f9fafb) - Gris suave
- **Blanco**: #ffffff - Fondo principal

### Colores de Estado
- **Success**: Green-500
- **Warning**: Amber-500
- **Error**: Red-500
- **Info**: Blue-500

---

## 📱 Sistema Responsive

### Breakpoints
```css
Mobile:  ≤767px
Tablet:  768px - 1279px
Desktop: ≥1280px
```

### Implementación
```tsx
// Desktop
className="hidden lg:flex"

// Tablet y Desktop
className="hidden md:flex"

// Móvil únicamente
className="lg:hidden"

// Móvil y Tablet
className="md:hidden"
```

---

## 🎯 Componentes Estilo Apple

### Clases Reutilizables (index.css)

#### Botones
```css
/* Botón primario */
.apple-button-primary
- Fondo: slate-900
- Texto: blanco
- Padding: px-6 py-2.5
- Border radius: rounded-xl
- Hover: escala 95% + sombra
- Transición suave

/* Botón secundario (acento) */
.apple-button-secondary
- Fondo: amber-400
- Texto: slate-900
- Mismas propiedades que primary

/* Botón ghost */
.apple-button-ghost
- Fondo: gray-100
- Texto: slate-800
- Hover: gray-200
```

#### Cards
```css
.apple-card
- Fondo: blanco
- Border radius: rounded-2xl
- Sombra suave
- Borde: border-gray-100
- Hover: sube 2px + sombra más grande
```

#### Inputs
```css
.apple-input
- Padding: px-4 py-3
- Border radius: rounded-xl
- Border: border-gray-200
- Focus: ring slate-900/20
- Placeholder: gray-400
```

#### Efecto Glass (Vidrio)
```css
.apple-glass
- Backdrop filter: blur(20px)
- Fondo semi-transparente
- Borde sutil
```

---

## 🏗️ Estructura de Componentes

### Header
**Características Apple-Style:**
- Altura: 80px (h-20)
- Efecto glass con backdrop-filter
- Sticky top-0
- Botones circulares para acciones
- Avatar con gradiente
- Responsive con menú hamburguesa en móvil
- Segmentado de moneda minimalista

**Responsive:**
- Desktop: Todos los elementos visibles
- Tablet: Oculta algunos botones
- Móvil: Menú hamburguesa, mínimos elementos

### Sidebar
**Características Apple-Style:**
- Ancho: 256px (w-64)
- Gradiente de fondo: from-slate-900 to-slate-950
- Logo con badge amarillo en esquina redondeada
- Navegación con barra amarilla en selección activa
- Indicador lateral (barra vertical amarilla)
- Avatar del usuario en footer
- Íconos con transición de color

**Responsive:**
- Desktop: Siempre visible, posición fija
- Tablet: Colapsable con overlay
- Móvil: Drawer con backdrop blur

### Layout
**Características:**
- Max-width: 1600px centrado
- Padding responsivo
- Overflow controlado
- Estado de sidebar manejado

---

## 🎭 Animaciones

### Clases Disponibles

```css
/* Fade in suave */
.fade-in
- Duración: 0.3s
- Opacity 0 → 1

/* Slide up */
.slide-up
- Duración: 0.3s
- Opacity + translateY

/* Scale al click */
active:scale-95
- Escala a 95% al presionar
```

### Transiciones
```css
/* Por defecto en todos los elementos */
transition-colors duration-200

/* Transiciones personalizadas */
transition-all duration-200
cubic-bezier(0.4, 0, 0.2, 1)
```

---

## 📐 Espaciado Apple-Style

### Sistema Base
```
Pequeño:  gap-2  (8px)
Medio:    gap-4  (16px)
Grande:   gap-6  (24px)
Extra:    gap-8  (32px)
```

### Padding en Contenedores
```
Mobile:   px-4 py-6
Tablet:   px-6 py-6
Desktop:  px-8 py-8
```

---

## 🔧 Cómo Aplicar a Nuevos Componentes

### 1. Cards
```tsx
<div className="apple-card p-6 hover:shadow-xl">
  <h3 className="text-xl font-semibold text-slate-900 mb-4">
    Título
  </h3>
  <p className="text-gray-600">Contenido</p>
</div>
```

### 2. Botones
```tsx
// Primario
<button className="apple-button-primary">
  Acción Principal
</button>

// Secundario
<button className="apple-button-secondary">
  Acción Secundaria
</button>

// Ghost
<button className="apple-button-ghost">
  Cancelar
</button>
```

### 3. Formularios
```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      Nombre
    </label>
    <input
      type="text"
      className="apple-input"
      placeholder="Ingrese su nombre"
    />
  </div>
</div>
```

### 4. Tablas (Desktop)
```tsx
<div className="hidden md:block apple-card overflow-hidden">
  <table className="w-full">
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Columna
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 text-sm text-gray-900">
          Dato
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 5. Cards en Móvil (Reemplazo de Tablas)
```tsx
<div className="md:hidden space-y-3">
  <div className="apple-card p-4">
    <div className="flex justify-between items-center mb-3">
      <h4 className="font-semibold text-slate-900">Título</h4>
      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-lg font-medium">
        Estado
      </span>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500">Campo:</span>
        <span className="font-medium text-slate-800">Valor</span>
      </div>
    </div>
  </div>
</div>
```

### 6. Modales
```tsx
<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center fade-in">
  <div className="apple-card w-full max-w-lg m-4 overflow-hidden slide-up">
    <div className="px-6 py-5 border-b border-gray-100">
      <h3 className="text-xl font-semibold text-slate-900">
        Título Modal
      </h3>
    </div>
    <div className="p-6">
      {/* Contenido */}
    </div>
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
      <button className="apple-button-ghost">
        Cancelar
      </button>
      <button className="apple-button-primary">
        Confirmar
      </button>
    </div>
  </div>
</div>
```

---

## 🎨 Tipografía

### Tamaños
```
Título Principal:  text-3xl md:text-4xl
Título Sección:    text-2xl md:text-3xl
Subtítulo:         text-xl
Cuerpo:            text-base
Pequeño:           text-sm
Extra Pequeño:     text-xs
```

### Pesos
```
Bold:              font-bold (700)
Semibold:          font-semibold (600)
Medium:            font-medium (500)
Normal:            font-normal (400)
```

### Tracking
```
Títulos:           tracking-tight
Normal:            tracking-normal
Labels:            tracking-wide
All Caps:          tracking-widest
```

---

## 📱 Patrones Responsive

### Grillas
```tsx
// 1 columna móvil, 2 en tablet, 3 en desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* items */}
</div>

// 1 columna móvil, 2 en tablet, 4 en desktop
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
  {/* items */}
</div>
```

### Flex Responsive
```tsx
// Stack en móvil, fila en desktop
<div className="flex flex-col lg:flex-row gap-4">
  {/* elementos */}
</div>
```

### Padding Responsive
```tsx
className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8"
```

---

## 🔔 Estados y Badges

### Badges de Estado
```tsx
// Success
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Activo
</span>

// Warning
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
  Pendiente
</span>

// Error
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
  Inactivo
</span>
```

---

## ✅ Checklist de Implementación

Al crear un nuevo componente, asegúrate de:

- [ ] Usar `apple-card` para contenedores
- [ ] Aplicar `apple-button-*` a botones
- [ ] Implementar responsive con breakpoints
- [ ] Usar `apple-input` en formularios
- [ ] Agregar `fade-in` o `slide-up` para animaciones
- [ ] Incluir estados hover y active
- [ ] Implementar vista móvil con cards (si aplica)
- [ ] Usar espaciado consistente (múltiplos de 4)
- [ ] Aplicar tipografía con tracking-tight en títulos
- [ ] Probar en desktop, tablet y móvil

---

## 🚀 Próximos Pasos

Para aplicar el diseño Apple-style al resto de la aplicación:

1. **Dashboard**: Usar grid responsive con cards
2. **Proyectos**: Tabla en desktop, cards en móvil
3. **Inventario**: Lista con filtros colapsables
4. **Modales**: Aplicar estructura con backdrop blur
5. **Formularios**: Usar apple-input y labels elegantes
6. **Notificaciones**: Dropdown con glass-morphism

---

## 💡 Tips Finales

1. **Siempre piensa en móvil primero**: Diseña la versión móvil antes de desktop
2. **Usa gradientes sutiles**: from-slate-900 to-slate-950 para profundidad
3. **Transiciones suaves**: duration-200 o duration-300 máximo
4. **Espaciado amplio**: No tengas miedo del espacio en blanco
5. **Consistencia**: Usa las mismas clases en toda la app
6. **Hover states**: Siempre agrega feedback visual
7. **Active states**: scale-95 para botones presionados
8. **Sombras**: Usar apple-shadow para elevación

---

**Sistema creado para SolarEPC con amor y atención al detalle inspirado en Apple.**
