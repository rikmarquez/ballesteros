# Protocolo de Inicio - Claude Code

## 🎯 Instrucciones de Inicio de Sesión

Hola Claude Code! Al iniciar cada sesión, por favor:

### 1. Lee la documentación del proyecto
Debes leer estos archivos EN ORDEN:

1. **`docs/project-status-new.md`** - Para conocer el estado actual (ARQUITECTURA REFACTORIZADA)
2. **`docs/technical-specs-new.md`** - Para entender la nueva arquitectura unificada
3. **`docs/session-learnings-new.md`** - Para aprender de sesiones anteriores y decisiones críticas

### 2. Contexto del Proyecto

**Deploy:** Este proyecto está desplegado en Railway
**Importante:** Todas las configuraciones de despliegue están en `technical-specs.md`

### 3. Proceso de Inicio

Después de leer los archivos:
1. Confirma que comprendes el estado actual del proyecto
2. Resume brevemente:
   - Qué está completo
   - Qué está en progreso
   - Problemas conocidos
3. **IMPORTANTE**: Revisar el plan de trabajo actual definido en el TODO

### 🎯 Plan de Trabajo Actual (Post-Refactorización)

**FASE 1: Migración Frontend (PRIORIDAD ALTA)**
1. ✅ Verificar que el servidor de desarrollo funciona correctamente
2. 🔄 Actualizar módulo de cortes para usar nueva API `/api/movimientos`
3. 🔄 Migrar formularios de entidades para trabajar con estructura unificada
4. 🔄 Probar flujos end-to-end de creación de movimientos
5. 🔄 Validar cálculos automáticos de cortes con nuevos campos específicos

**FASE 2: Nuevas Funcionalidades**
6. 🔄 Implementar dashboard con vista unificada multi-empresa

**CONTEXTO**: Acabamos de completar una refactorización mayor de la base de datos (2025-09-22) de 13 tablas fragmentadas a 9 tablas unificadas. Todas las APIs backend están actualizadas, pero el frontend necesita migración.

4. Pregúntame: **"¿Continuamos con el plan definido o hay algo específico en lo que quieres trabajar?"**

### 4. Durante la Sesión

- Consulta `session-learnings.md` antes de resolver problemas similares
- Si encuentras un error, revisa si hay una solución documentada
- Mantén en mente la estructura de datos y endpoints de `technical-specs.md`

### 5. Al Finalizar la Sesión

Recuérdame actualizar:
- [ ] `project-status-new.md` - Estado y próximos pasos
- [ ] `technical-specs-new.md` - Si hubo cambios en arquitectura/BD/endpoints
- [ ] `session-learnings-new.md` - Problemas encontrados y soluciones

---

## 📌 Reglas Importantes

1. **Siempre lee los docs antes de empezar a codear**
2. **Referencia los aprendizajes previos cuando sea relevante**
3. **Sigue las convenciones establecidas en technical-specs.md**
4. **Railway es nuestro ambiente de despliegue - considera esto en decisiones técnicas**

---

**Versión del protocolo:** 1.0
**Última actualización:** 2025-09-21