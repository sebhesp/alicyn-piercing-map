/* ============================================================================
   ALICYN BODY MAP — DATA LAYER
   Base de datos local de piercings, zonas, fases y reglas de planeación.
   Todo el contenido es educativo y NO sustituye criterio profesional.
   ============================================================================ */

const ALICYN_DISCLAIMER =
  'La información de esta herramienta es orientativa y no sustituye la valoración de un perforador profesional. Los tiempos de proceso varían según anatomía, técnica, joyería, cuidados y estilo de vida. Ningún resultado está garantizado.';

const ANATOMY_REMINDER =
  'Cada anatomía es única. La viabilidad de un piercing depende de tejido, pliegue, profundidad, vascularización, ángulo, simetría, historial de cicatrización, estilo de vida y el criterio del perforador. Esta herramienta visualiza posibilidades, no determina resultados.';

/* ---------- ZONAS DEL CUERPO ---------- */
const ZONES = [
  { id: 'ear',     label: 'Oreja',     short: 'Oreja' },
  { id: 'nose',    label: 'Nariz',     short: 'Nariz' },
  { id: 'mouth',   label: 'Boca / Labios', short: 'Boca' },
  { id: 'brow',    label: 'Ceja',      short: 'Ceja' },
  { id: 'tongue',  label: 'Lengua',    short: 'Lengua' },
  { id: 'navel',   label: 'Ombligo',   short: 'Ombligo' },
  { id: 'nipple',  label: 'Pezón',     short: 'Pezón' },
  { id: 'surface', label: 'Superficie / Body', short: 'Superficie' }
];

/* ---------- FASES DEL PROYECTO ---------- */
const PROJECT_PHASES = [
  { id: 'p1', label: 'Fase 1 · Base', desc: 'Punto de partida. Piercings con menor demanda de proceso y más tolerancia a errores.' },
  { id: 'p2', label: 'Fase 2 · Construcción', desc: 'Una vez que la fase base está estable. Requiere tiempo y seguimiento.' },
  { id: 'p3', label: 'Fase 3 · Cierre', desc: 'Mayor precisión anatómica. Conviene esperar que las fases anteriores estén consolidadas.' },
  { id: 'pf', label: 'Fase futura', desc: 'Para revisitar en una próxima consulta, según evolución de la anatomía y proceso.' }
];

/* ---------- ESTADOS ANATÓMICOS — Sistema Alicyn ----------
   No indican diagnóstico ni resultado garantizado.
   Son orientaciones visuales para la conversación en consulta.
*/
const ANATOMY_STATES = [
  {
    id: 'compatible',
    label: 'Compatible visualmente',
    shortLabel: 'Compatible',
    color: '#5fd4a8',
    desc: 'La zona presenta condiciones visuales favorables para esta opción. Requiere valoración presencial.'
  },
  {
    id: 'ajuste',
    label: 'Requiere ajuste',
    shortLabel: 'Con ajuste',
    color: '#e6c560',
    desc: 'Puede ser viable con modificaciones en ángulo, posición o joyería. El perforador define la viabilidad real.'
  },
  {
    id: 'limitado',
    label: 'Espacio limitado',
    shortLabel: 'Espacio limitado',
    color: '#e07a7a',
    desc: 'La anatomía visible sugiere espacio reducido. Se necesita evaluación directa para confirmar viabilidad.'
  },
  {
    id: 'presion',
    label: 'Zona sensible a presión',
    shortLabel: 'Sensible a presión',
    color: '#7aa6e0',
    desc: 'La zona puede recibir presión frecuente (dormir, accesorios, ropa). Considerar en la planificación.'
  },
  {
    id: 'valoracion',
    label: 'Requiere valoración profesional',
    shortLabel: 'Valoración prof.',
    color: '#b48ae0',
    desc: 'Esta opción necesita una evaluación presencial antes de cualquier decisión. No se puede determinar visualmente.'
  }
];

/* ---------- CARGA DE CICATRIZACIÓN ALICYN ----------
   Sistema propietario para comunicar la demanda total de un plan de piercings.
   No predice resultados. Orienta la conversación sobre tiempos y fases.
*/
const HEALING_LOAD = [
  {
    id: 'baja',
    label: 'Baja',
    range: [0, 2],
    desc: 'Plan con baja demanda de proceso. Buena base para comenzar.',
    color: '#5fd4a8',
    advice: 'Proyecto accesible. Cuidados básicos bien llevados suelen dar buenos resultados.'
  },
  {
    id: 'media',
    label: 'Media',
    range: [3, 4],
    desc: 'Requiere cuidado consistente y atención en las primeras semanas.',
    color: '#e6c560',
    advice: 'Considerar dividir en dos momentos si el proceso se complica en alguno de los puntos.'
  },
  {
    id: 'alta',
    label: 'Alta',
    range: [5, 6],
    desc: 'Plan exigente. Conviene distribuirlo en fases con tiempo entre ellas.',
    color: '#e09060',
    advice: 'Planificación por fases es clave. No es recomendable hacer todo en una sola sesión.'
  },
  {
    id: 'muy_alta',
    label: 'Muy alta',
    range: [7, 99],
    desc: 'Proyecto de largo plazo. Requiere paciencia, seguimiento y revisiones periódicas.',
    color: '#e07a7a',
    advice: 'Este plan requiere un acompañamiento profesional cercano y fases bien espaciadas.'
  }
];

/* Función helper para obtener la carga según número de piercings */
function getHealingLoad(count) {
  return HEALING_LOAD.find(l => count >= l.range[0] && count <= l.range[1]) || HEALING_LOAD[HEALING_LOAD.length - 1];
}

/* ---------- PIERCINGS ----------
   Cada piercing trae los campos completos solicitados.
   Los tiempos son estimaciones basadas en literatura común; cada anatomía es única.
*/
const PIERCINGS = [
  {
    id: 'lobulo',
    nombre: 'Lóbulo',
    zona: 'ear',
    descripcion: 'El piercing más común. Atraviesa el lóbulo, tejido blando sin cartílago, lo que permite cicatrización ágil.',
    dolor: 2,
    cicatrizacion: '6 a 8 semanas',
    joyeria: 'Labret de titanio implant grade, post 1.0–1.2 mm, longitud según hinchazón.',
    molestias: ['Sensibilidad al dormir de lado', 'Picor leve en primeras semanas', 'Costras secas'],
    cuidados: ['Limpieza con suero fisiológico 1–2 veces al día', 'No girar la joyería', 'Cabello recogido las primeras semanas'],
    errores: ['Cambiar la joyería antes de tiempo', 'Usar pendientes con tija demasiado corta', 'Limpiar con alcohol o peróxido'],
    alertas: ['Secreción amarillenta espesa', 'Calor local persistente', 'Dolor pulsátil que aumenta'],
    compatibilidad: ['lobulo_alto', 'helix', 'tragus'],
    mantenimiento: 'Bajo',
    inspiracion: 'Stack minimalista en oro, soluciones chain ear, hoops finos.',
    recomendacion: 'Ideal como punto de partida para construir un proyecto de oreja por fases.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'lobulo_alto',
    nombre: 'Lóbulo alto',
    zona: 'ear',
    descripcion: 'Variante en la zona superior del lóbulo. Permite curaciones laterales y stacks en columna.',
    dolor: 3,
    cicatrizacion: '8 a 12 semanas',
    joyeria: 'Labret de titanio, post 1.0–1.2 mm.',
    molestias: ['Roce con audífonos', 'Sensibilidad al dormir de lado'],
    cuidados: ['Suero fisiológico 1–2 veces al día', 'Evitar audífonos in-ear los primeros días'],
    errores: ['Colocarlo demasiado cerca del lóbulo bajo', 'Joyería pesada en las primeras semanas'],
    alertas: ['Inflamación que no cede tras 2 semanas', 'Migración visible'],
    compatibilidad: ['lobulo', 'helix', 'flat'],
    mantenimiento: 'Bajo',
    inspiracion: 'Curación lineal con joyería minimalista, mismo metal repetido.',
    recomendacion: 'Excelente segundo piercing para crear simetría y volumen visual.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'helix',
    nombre: 'Helix',
    zona: 'ear',
    descripcion: 'Piercing en el cartílago superior externo. Versátil pero más sensible que el lóbulo.',
    dolor: 5,
    cicatrizacion: '6 a 12 meses',
    joyeria: 'Labret de titanio implant grade, post 1.0–1.2 mm, top de rosca interna.',
    molestias: ['Dolor al dormir de lado', 'Bumps por presión', 'Sensibilidad varios meses'],
    cuidados: ['Suero fisiológico 2 veces al día', 'No dormir sobre el lado afectado', 'Almohada limpia y secarse al salir de la regadera'],
    errores: ['Usar argollas como joyería inicial', 'Cambiar antes de cicatrizar', 'Manipular con manos sucias'],
    alertas: ['Bumps de queloide', 'Migración hacia el borde', 'Secreción persistente'],
    compatibilidad: ['lobulo', 'lobulo_alto', 'flat', 'conch', 'tragus'],
    mantenimiento: 'Medio',
    inspiracion: 'Curaciones limpias, joyas con piedras pequeñas, hoops finos para etapa cicatrizada.',
    recomendacion: 'Pieza clave en proyectos de oreja. Asegura buena posición en función del rizo del helix.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'flat',
    nombre: 'Flat',
    zona: 'ear',
    descripcion: 'Piercing en la zona plana del cartílago superior. Permite joyería decorativa amplia.',
    dolor: 5,
    cicatrizacion: '6 a 12 meses',
    joyeria: 'Labret de titanio, post 1.2 mm, top con diseño plano.',
    molestias: ['Sensibilidad al dormir', 'Picor ocasional', 'Costras durante semanas'],
    cuidados: ['Suero fisiológico', 'Almohadilla en forma de dona si duele al dormir'],
    errores: ['Joyería demasiado grande al inicio', 'Cambios prematuros'],
    alertas: ['Bumps', 'Inflamación que no cede'],
    compatibilidad: ['helix', 'conch', 'rook'],
    mantenimiento: 'Medio',
    inspiracion: 'Tops decorativos amplios, formas geométricas, clusters.',
    recomendacion: 'Combina muy bien con helix para construir una curación visual completa.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'conch',
    nombre: 'Conch',
    zona: 'ear',
    descripcion: 'Piercing en el cartílago central de la oreja. Inner o outer según ubicación.',
    dolor: 6,
    cicatrizacion: '6 a 12 meses',
    joyeria: 'Labret de titanio, post 1.2 mm; en etapa cicatrizada también ring grueso.',
    molestias: ['Roce con audífonos', 'Dolor al dormir de lado'],
    cuidados: ['Suero fisiológico', 'Evitar audífonos in-ear', 'No usar gorros muy ajustados al inicio'],
    errores: ['Usar argolla pequeña como joyería inicial', 'Joyería de mala calidad'],
    alertas: ['Bumps grandes', 'Encapsulamiento'],
    compatibilidad: ['helix', 'flat', 'tragus'],
    mantenimiento: 'Medio',
    inspiracion: 'Hoops gruesos en etapa cicatrizada, studs decorativos.',
    recomendacion: 'Ancla visual del proyecto. Considera el rebote del lóbulo y la posición del audífono.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'tragus',
    nombre: 'Tragus',
    zona: 'ear',
    descripcion: 'Piercing en la pequeña pestaña frente al canal auditivo.',
    dolor: 5,
    cicatrizacion: '4 a 8 meses',
    joyeria: 'Labret de titanio, post corto, top pequeño.',
    molestias: ['Sensibilidad al usar audífonos', 'Roce con teléfono'],
    cuidados: ['Suero fisiológico', 'Evitar audífonos in-ear', 'Limpiar el teléfono regularmente'],
    errores: ['Top demasiado grande', 'Cambios prematuros'],
    alertas: ['Migración', 'Bumps recurrentes'],
    compatibilidad: ['helix', 'conch', 'lobulo'],
    mantenimiento: 'Medio',
    inspiracion: 'Studs pequeños con piedra, formas minimalistas.',
    recomendacion: 'Anatomía decisiva: requiere tragus con buen volumen para alojar la joyería.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'daith',
    nombre: 'Daith',
    zona: 'ear',
    descripcion: 'Piercing en el pliegue interno del cartílago. Visualmente atractivo y muy dependiente de anatomía.',
    dolor: 6,
    cicatrizacion: '6 a 12 meses',
    joyeria: 'Clicker o ring de titanio implant grade, calibre 1.2–1.6 mm.',
    molestias: ['Dolor al dormir', 'Sensibilidad prolongada'],
    cuidados: ['Suero fisiológico', 'No manipular', 'Cuidar al ponerse y quitarse audífonos'],
    errores: ['Forzar la anatomía si el pliegue no es viable', 'Joyería barata'],
    alertas: ['Bumps internos', 'Encapsulamiento'],
    compatibilidad: ['lobulo', 'helix', 'tragus'],
    mantenimiento: 'Medio',
    inspiracion: 'Clickers detallados, anillos heart-shape, segmentados.',
    recomendacion: 'Pide una evaluación anatómica precisa. No todos los daith son viables.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'rook',
    nombre: 'Rook',
    zona: 'ear',
    descripcion: 'Piercing en el pliegue superior interno de la oreja. Anatomía marcada es prerrequisito.',
    dolor: 6,
    cicatrizacion: '6 a 12 meses',
    joyeria: 'Curved barbell de titanio, calibre 1.2 mm.',
    molestias: ['Sensibilidad al dormir', 'Picor durante semanas'],
    cuidados: ['Suero fisiológico', 'No dormir del lado afectado'],
    errores: ['Forzar el rook si el pliegue es plano', 'Joyería incorrecta'],
    alertas: ['Migración', 'Bumps'],
    compatibilidad: ['daith', 'helix', 'conch'],
    mantenimiento: 'Medio',
    inspiracion: 'Curved barbells con piedras, joyas curvas elegantes.',
    recomendacion: 'No todos los rooks son viables; el pliegue debe permitir alojar la joyería sin tensión.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'industrial',
    nombre: 'Industrial',
    zona: 'ear',
    descripcion: 'Dos perforaciones unidas por una barra recta a través del cartílago superior.',
    dolor: 7,
    cicatrizacion: '6 a 12 meses',
    joyeria: 'Barra recta de titanio implant grade, calibre 1.2–1.6 mm, longitud individualizada.',
    molestias: ['Dolor al dormir', 'Mayor riesgo de bumps', 'Sensibilidad prolongada'],
    cuidados: ['Suero fisiológico 2 veces al día', 'Evitar dormir del lado', 'Limpieza disciplinada por meses'],
    errores: ['Hacerlo en oreja con poco rizo', 'Cambiar la barra antes de tiempo'],
    alertas: ['Migración', 'Bumps recurrentes', 'Rechazo'],
    compatibilidad: ['lobulo', 'tragus'],
    mantenimiento: 'Alto',
    inspiracion: 'Barras decorativas con detalles centrales, twin-stones.',
    recomendacion: 'Requiere anatomía favorable y compromiso disciplinado de cuidados.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'nostril',
    nombre: 'Nostril',
    zona: 'nose',
    descripcion: 'Piercing en la aleta de la nariz. Clásico, versátil y muy popular.',
    dolor: 4,
    cicatrizacion: '4 a 6 meses',
    joyeria: 'Labret de titanio implant grade, post 0.8–1.0 mm, top con piedra o argolla pequeña.',
    molestias: ['Sensibilidad al sonarse', 'Bumps por mascarilla o anteojos', 'Costras frecuentes'],
    cuidados: ['Suero fisiológico', 'No tocar con manos sucias', 'Cuidado con maquillaje y cremas faciales'],
    errores: ['Argollas demasiado pronto', 'Tocar al sonarse', 'Cambiar antes de tiempo'],
    alertas: ['Bumps persistentes', 'Inflamación que no cede'],
    compatibilidad: ['septum', 'lobulo'],
    mantenimiento: 'Medio',
    inspiracion: 'Studs minimalistas, argollas finas en etapa cicatrizada.',
    recomendacion: 'Cuida especialmente la fase de costras y evita cambios anticipados.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'septum',
    nombre: 'Septum',
    zona: 'nose',
    descripcion: 'Piercing en el cartílago central inferior de la nariz, en la zona blanda llamada sweet spot.',
    dolor: 5,
    cicatrizacion: '6 a 8 meses',
    joyeria: 'Clicker de titanio o circular barbell, calibre 1.2–1.6 mm.',
    molestias: ['Estornudos sensibles', 'Lagrimeo durante el procedimiento'],
    cuidados: ['Suero fisiológico', 'No flipear la joyería antes de tiempo'],
    errores: ['Atravesar el cartílago duro en lugar del sweet spot', 'Cambios prematuros'],
    alertas: ['Asimetría visible', 'Dolor punzante'],
    compatibilidad: ['nostril', 'lobulo'],
    mantenimiento: 'Medio',
    inspiracion: 'Clickers detallados, joyería ornamental, rings simples.',
    recomendacion: 'La técnica y la ubicación del sweet spot son críticas. Trabaja solo con perforador profesional.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'bridge',
    nombre: 'Bridge',
    zona: 'nose',
    descripcion: 'Piercing de superficie horizontal entre los ojos, sobre el puente nasal.',
    dolor: 5,
    cicatrizacion: '8 a 12 meses',
    joyeria: 'Straight barbell de titanio, calibre 1.2–1.6 mm.',
    molestias: ['Roce con anteojos', 'Sensibilidad', 'Migración relativamente común'],
    cuidados: ['Suero fisiológico', 'Evitar anteojos pesados durante semanas'],
    errores: ['Hacerlo si no hay tejido suficiente', 'Joyería de mala calidad'],
    alertas: ['Migración visible', 'Rechazo'],
    compatibilidad: ['nostril', 'septum'],
    mantenimiento: 'Alto',
    inspiracion: 'Barbells con piedras gemelas, diseño industrial-elegante.',
    recomendacion: 'Es un piercing de superficie con riesgo de migración. Evalúa muy bien el tejido disponible.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'labret',
    nombre: 'Labret',
    zona: 'mouth',
    descripcion: 'Piercing centrado bajo el labio inferior.',
    dolor: 4,
    cicatrizacion: '6 a 10 semanas',
    joyeria: 'Labret de titanio con disco interno, post 1.2 mm.',
    molestias: ['Inflamación importante los primeros días', 'Roce con dientes y encías'],
    cuidados: ['Suero fisiológico exterior', 'Enjuagues con solución salina sin alcohol', 'Cuidar comidas calientes y picantes'],
    errores: ['Joyería externa con cuenta que daña encías', 'Comer alimentos muy calientes los primeros días'],
    alertas: ['Retracción gingival', 'Desgaste dental'],
    compatibilidad: ['medusa', 'lobulo'],
    mantenimiento: 'Alto',
    inspiracion: 'Tops minimalistas, piedras pequeñas, opaque finishes.',
    recomendacion: 'Vigila siempre el contacto con dientes y encías. Cambia a joyería corta tras la inflamación.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'medusa',
    nombre: 'Medusa',
    zona: 'mouth',
    descripcion: 'Piercing en el surco labial superior, justo bajo la nariz (philtrum).',
    dolor: 4,
    cicatrizacion: '6 a 10 semanas',
    joyeria: 'Labret de titanio con disco interno, post 1.2 mm.',
    molestias: ['Inflamación los primeros días', 'Sensibilidad al hablar y comer'],
    cuidados: ['Suero fisiológico', 'Enjuagues sin alcohol', 'Evitar besos en fase inicial'],
    errores: ['Top demasiado grande', 'No reducir la longitud post-inflamación'],
    alertas: ['Retracción gingival', 'Desgaste dental'],
    compatibilidad: ['labret', 'nostril'],
    mantenimiento: 'Alto',
    inspiracion: 'Studs sutiles, piedras pequeñas, finishes mate.',
    recomendacion: 'Cuidar la simetría con el philtrum es clave. Reducir longitud tras inflamación.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'lengua',
    nombre: 'Lengua',
    zona: 'tongue',
    descripcion: 'Piercing vertical centrado en la lengua. Requiere alta higiene oral.',
    dolor: 5,
    cicatrizacion: '4 a 6 semanas',
    joyeria: 'Barbell recto de titanio, post largo inicial 1.6 mm para acomodar inflamación.',
    molestias: ['Inflamación marcada los primeros 4–7 días', 'Dificultad para hablar y comer'],
    cuidados: ['Enjuagues con solución salina sin alcohol', 'Hielo para inflamación', 'Comidas blandas y frías'],
    errores: ['No reducir la longitud cuando la inflamación baja', 'Joyería de mala calidad', 'Fumar y alcohol en cicatrización'],
    alertas: ['Desgaste dental', 'Retracción gingival', 'Inflamación que aumenta tras día 7'],
    compatibilidad: ['labret'],
    mantenimiento: 'Alto',
    inspiracion: 'Bolas mate de titanio, dorados, opaque finishes.',
    recomendacion: 'Reducir longitud tras inflamación inicial es prioritario para proteger dientes.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'ceja',
    nombre: 'Ceja',
    zona: 'brow',
    descripcion: 'Piercing de superficie sobre la ceja. Anatomía y cuidados son críticos para evitar migración.',
    dolor: 4,
    cicatrizacion: '8 a 12 semanas',
    joyeria: 'Curved barbell de titanio, calibre 1.2–1.6 mm.',
    molestias: ['Roce con anteojos', 'Sensibilidad ocasional'],
    cuidados: ['Suero fisiológico', 'Cuidado con maquillaje y cremas en la zona'],
    errores: ['Joyería pesada al inicio', 'Tocar con manos sucias'],
    alertas: ['Migración visible', 'Rechazo'],
    compatibilidad: ['lobulo', 'nostril'],
    mantenimiento: 'Medio',
    inspiracion: 'Curved barbells finos, piedras pequeñas.',
    recomendacion: 'Es un piercing de superficie, hay riesgo natural de migración. Selecciona ubicación con criterio.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'ombligo',
    nombre: 'Ombligo',
    zona: 'navel',
    descripcion: 'Piercing en el pliegue superior del ombligo. La anatomía del pliegue determina viabilidad.',
    dolor: 4,
    cicatrizacion: '6 a 12 meses',
    joyeria: 'Curved barbell de titanio, calibre 1.6 mm.',
    molestias: ['Roce con ropa y cinturones', 'Sensibilidad al sentarse'],
    cuidados: ['Suero fisiológico', 'Ropa holgada y cintura baja', 'Evitar piscinas y jacuzzi en cicatrización'],
    errores: ['Forzarlo en ombligo sin pliegue', 'Joyería pesada al inicio'],
    alertas: ['Migración', 'Rechazo', 'Inflamación persistente'],
    compatibilidad: [],
    mantenimiento: 'Alto',
    inspiracion: 'Curved barbells decorativos, piedras superiores.',
    recomendacion: 'No todos los ombligos son aptos. La forma del pliegue superior es decisiva.',
    disclaimer: ANATOMY_REMINDER
  },
  {
    id: 'pezon',
    nombre: 'Pezón',
    zona: 'nipple',
    descripcion: 'Piercing horizontal a través del pezón.',
    dolor: 6,
    cicatrizacion: '6 a 12 meses',
    joyeria: 'Straight barbell de titanio, calibre 1.6 mm.',
    molestias: ['Sensibilidad prolongada', 'Roce con ropa'],
    cuidados: ['Suero fisiológico', 'Bralettes sin costuras', 'Evitar piscinas y jacuzzi'],
    errores: ['Joyería pesada al inicio', 'Cambios prematuros'],
    alertas: ['Inflamación persistente', 'Secreción anormal'],
    compatibilidad: [],
    mantenimiento: 'Alto',
    inspiracion: 'Barbells minimalistas, esferas pequeñas.',
    recomendacion: 'Anatomía y técnica son críticas. Trabaja solo con perforador con experiencia documentada.',
    disclaimer: ANATOMY_REMINDER
  }
];

/* ---------- HELPERS ---------- */
const Data = {
  PIERCINGS,
  ZONES,
  PROJECT_PHASES,
  ANATOMY_STATES,
  HEALING_LOAD,
  ANATOMY_REMINDER,
  ALICYN_DISCLAIMER,
  byId(id) { return PIERCINGS.find(p => p.id === id); },
  byZone(zoneId) { return PIERCINGS.filter(p => p.zona === zoneId); },
  getHealingLoad,
  earPiercings() {
    return ['lobulo', 'lobulo_alto', 'helix', 'flat', 'conch', 'tragus', 'daith', 'rook', 'industrial']
      .map(id => this.byId(id));
  },
  stateById(id) { return ANATOMY_STATES.find(s => s.id === id) || ANATOMY_STATES[0]; }
};

if (typeof window !== 'undefined') window.AlicynData = Data;
