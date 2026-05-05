# Alicyn Data Method

## Objetivo

Alicyn debe aprender de cada reseña, error, foto curada y comentario sin sacrificar seguridad, ética ni criterio anatómico. El mapa no solo muestra información: recolecta señales para mejorar decisiones futuras.

## Ciclo continuo

1. Captura
   - Reseñas: piercing, dolor, texto, foto opcional, utilidad.
   - Feedback: ideas, dudas frecuentes, fricción de uso.
   - Errores: datos incorrectos, navegación rota, mala expectativa, contenido riesgoso.
   - Inspo: fuente, permiso, zona, razón de aprobación o rechazo.

2. Curaduría
   - Nada viral entra directo al atlas.
   - Toda foto debe pasar por criterios de anatomía, joyería segura, ángulo claro, cicatrización plausible y ética profesional.
   - Las referencias no recomendadas se documentan por riesgo anatómico o médico, no por morbo.

3. Dataset
   - El panel Comunidad exporta `alicyn-learning-dataset.json`.
   - Incluye experiencias, feedback, métricas y `featureRows` para análisis.
   - Antes de entrenar modelos, eliminar identificadores personales y revisar consentimiento.

4. Métricas iniciales
   - Dolor promedio por piercing.
   - Utilidad por reseña.
   - Volumen de errores por vista.
   - Fotos pendientes de curaduría.
   - Piercings con poca evidencia.

5. Modelos futuros
   - Expectativa de dolor por piercing.
   - Ranking de reseñas más útiles.
   - Priorización de inspo para moderación.
   - Detección temprana de problemas de aftercare en texto.
   - Triage anatómico asistido para indicar cuándo consultar presencialmente.

## Regla central

Machine learning puede priorizar, resumir y detectar patrones. Nunca debe prometer viabilidad, diagnosticar ni reemplazar la evaluación presencial de un perforador profesional o personal médico.
