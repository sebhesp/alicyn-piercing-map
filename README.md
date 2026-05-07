# PierceMap

> **"PierceMap convierte la decisión de un piercing en una conversación informada entre cliente, anatomía y perforador profesional."**

Herramienta web interactiva para estudios de piercing y sus clientes. Corre completamente en el navegador — sin servidor, sin login, sin datos externos. Diseñada para mesa: iPad, tablet Android, iPhone y escritorio.

---

## ¿Qué hace?

| Vista | Para quién | Qué resuelve |
|---|---|---|
| **Mapa corporal** | Cliente + perforador | Explora zonas, tiempos de cicatrización, cuidados, errores comunes |
| **Planeador de Oreja** | Cliente + perforador | Construye proyectos por fases con tiempos reales |
| **Evaluación Anatómica** | Perforador en consulta | Sube foto, marca puntos, genera resumen exportable |
| **Modo Piercer** | Perforador | Vista profesional, flujo de trabajo y hoja de ruta del producto |

---

## Tesis de diseño

El problema no es información — es la conversación. La mayoría de consultas de piercing terminan en malentendidos porque el cliente decide desde la estética ("se ve bonito") sin entender anatomía, cicatrización ni compatibilidad. PierceMap no reemplaza al perforador: le da contexto al cliente *antes* de que empiece la consulta, para que la conversación sea más honesta, rápida y profesional.

**Principio central:** Esta herramienta visualiza posibilidades y registra observaciones. No diagnostica, no determina viabilidad, no garantiza resultados. El criterio final es siempre del perforador en la valoración presencial.

---

## Arquitectura

```
alicyn-body-map/
├── index.html      # SPA de una sola página — 4 vistas en el mismo DOM
├── styles.css      # Diseño tokens + layout + mobile-first
├── data.js         # Catálogo de zonas, estados, healing load, cuidados
└── app.js          # Toda la lógica: navegación, canvas, drawer, resumen
```

**Stack:** Vanilla JS · CSS custom properties · Canvas API · Pointer Events API · FileReader API · Navigator.share / Navigator.clipboard

**Sin dependencias externas** (excepto Google Fonts para Inter). Sin frameworks, sin bundler, sin build step.

### Patrones técnicos clave

**Coordenadas porcentuales en canvas** — Los puntos se guardan como `xPct / yPct` (fracción del tamaño CSS del canvas). Sobreviven redimensionado, rotación de pantalla y cambio de dispositivo.
```js
function toPct(x, y) {
  const r = cvs.getBoundingClientRect();
  return { xPct: x / r.width, yPct: y / r.height };
}
```

**Pointer Events unificados** — `pointerdown / pointermove / pointerup` maneja mouse y touch con el mismo código. `touch-action: none` en el canvas previene scroll accidental.

**DPR scaling** — Canvas pixelado en Retina/OLED resuelto con `devicePixelRatio` al momento del dibujo.

**Bottom sheets en móvil** — Drawer y modal de resumen se convierten en `position: fixed` + `translateY` bottom sheets en pantallas < 480px.

---

## Sistema de estados anatómicos

Reemplaza el binario "Apto / No apto" con 5 estados de observación que reflejan matices reales:

| ID | Etiqueta | Color |
|---|---|---|
| `compatible` | Compatible visualmente | Verde `#5fd4a8` |
| `ajuste` | Requiere ajuste | Amarillo `#e6c560` |
| `limitado` | Espacio limitado | Rojo `#e07a7a` |
| `presion` | Zona sensible a presión | Azul `#7aa6e0` |
| `valoracion` | Requiere valoración profesional | Púrpura `#b48ae0` |

---

## Carga de cicatrización PierceMap

Métrica propietaria basada en número de puntos activos. Aparece en el resumen exportable y guía la conversación de postprocedimiento:

| Nivel | Puntos | Color |
|---|---|---|
| Baja | 0–2 | `#5fd4a8` |
| Media | 3–4 | `#e6c560` |
| Alta | 5–6 | `#e09060` |
| Muy alta | 7+ | `#e07a7a` |

---

## Resumen exportable

El resumen de evaluación incluye:
- Nombre del cliente (opcional, personaliza el saludo)
- Carga de cicatrización PierceMap con descripción
- Lista de puntos con estado, joyería, fase y nota profesional
- Cuidados generales de cicatrización
- Disclaimer PierceMap (lenguaje orientativo, nunca absoluto)

Formatos de salida: copiar al portapapeles · descargar `.txt` · imprimir · WhatsApp (navigator.share)

---

## Checklist antes de primer deploy

- [ ] Abrir en Chrome DevTools con emulación iPhone 375px — verificar bottom nav, canvas touch, bottom sheets
- [ ] Abrir en iPad Safari — verificar drawer lateral, planeador, canvas con Apple Pencil
- [ ] Probar flujo completo: mapa → drawer → planeador → anatomía → resumen → exportar
- [ ] Verificar que `btn-consult-mode` en Piercer tiene comportamiento definido en app.js
- [ ] Confirmar que `navigator.share` llama fallback a clipboard en navegadores sin soporte
- [ ] Revisar disclaimer final — ninguna frase usa "garantiza", "apto" o "diagnóstico"
- [ ] Validar HTML con W3C Validator (sin errores críticos)
- [ ] Lighthouse en mobile: accesibilidad > 85, performance > 75
- [ ] Probar con teclado solo (navegación por tabs, foco visible)
- [ ] Revisar que todos los `aria-label` en botones de icono estén completos

---

## Checklist de prueba con perforadores reales

### Sesión 1:1 en estudio (30–45 min)

**Setup:** abre la herramienta en el iPad del estudio o el celular del perforador

**Preguntas clave durante la prueba:**

- [ ] ¿Qué fue lo primero que hiciste en la herramienta sin instrucciones?
- [ ] ¿Algo en el mapa te parece incorrecto o incompleto?
- [ ] ¿Los 5 estados anatómicos tienen sentido para tu trabajo diario? ¿Usarías todos?
- [ ] ¿La Carga de cicatrización PierceMap es un concepto que le explicarías a un cliente?
- [ ] ¿El resumen exportado tiene el tono correcto? ¿Se lo darías a un cliente tal cual?
- [ ] ¿Qué información falta en el resumen?
- [ ] ¿El canvas de evaluación es usable con tu flujo real de consulta?
- [ ] ¿Qué harías diferente en la vista Piercer?

**Métricas a observar (sin decírselas):**
- Tiempo hasta primer punto marcado en canvas
- Si descubren el campo "nombre del cliente" sin ayuda
- Si leen el disclaimer o lo ignoran
- Si intentan exportar por WhatsApp

---

## Roadmap

### V1.1 — Consolidación (próximo)
- Fichas de cliente guardadas en `localStorage`
- Seguimiento postprocedimiento por semanas (checklist de cicatrización)
- Galería de inspiración filtrada por zona y anatomía
- Mejora de accesibilidad (A11y audit completo)

### V2 — Estudio
- PDF profesional exportable con logo del estudio
- Modo multi-piercer (perfiles por perforador)
- Agenda básica: citas, sesiones, fase actual por cliente
- Historial de evaluaciones por cliente

### V3 — Red
- Panel SaaS para estudios (múltiples sedes)
- Modo multilingüe (EN / PT)
- Integración con plataformas de booking
- Galería de trabajos reales del estudio
- API para embeber en sitio web del estudio

---

## Filosofía de tono

La herramienta nunca dice "esto sí se puede" o "esto no se puede". El lenguaje siempre es:
- **Orientativo**, no prescriptivo
- **Profesional** pero accesible — sin jerga médica innecesaria
- **Cercano** — usa segunda persona, tono de consulta, no de manual
- **Honesto sobre sus límites** — siempre recuerda que el perforador presencial tiene la última palabra

---

## Créditos

Concebido y desarrollado para **PierceMap · MX**  
Diseño de sistema: oscuro, editorial, premium — inspirado en atlas y herramientas de salud digital  
Stack: HTML · CSS · Vanilla JS · Canvas API

---

*Versión 0.1 MVP · Mayo 2025*
