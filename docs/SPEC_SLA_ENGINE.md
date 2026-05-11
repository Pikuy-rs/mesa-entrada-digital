# Spec: SLA Calculation Engine (GALA-SLA-01)

**Estado:** Estable  
**Versión:** 1.0.0  
**Referencia:** github/spec-kit  

## 1. Objetivo
Definir el estándar técnico para el cálculo del tiempo de respuesta (SLA) en la Mesa de Entrada Digital para garantizar métricas de gestión precisas.

## 2. Definición de Datos (Input)

El motor de cálculo requiere los siguientes campos del documento de solicitud:

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `createdAt` | Timestamp | Fecha y hora de creación del registro. |
| `completedAt` | Timestamp | Fecha y hora en que el administrador marcó como completado. |

## 3. Lógica de Procesamiento

El cálculo debe seguir estas reglas estrictas:

1.  **Exclusión de Nulos**: Si `completedAt` no existe (trámite pendiente), el registro no debe promediarse en el SLA histórico, pero puede usarse para el SLA de "Tiempo en curso".
2.  **Diferencia de Tiempo**: La diferencia debe calcularse en **horas**.
3.  **Redondeo**: Se debe redondear a un decimal.
4.  **Filtro de Outliers**: Registros con tiempos negativos (errores de sistema) deben ser ignorados.

## 4. Formato de Salida (Output)

El resultado se visualiza en la **KPI Card** del Dashboard GALA:

-   **Formato Humano**:
    -   Si `< 24 horas`: "X.X horas"
    -   Si `> 24 horas`: "X.X días"
-   **Umbrales de Eficiencia**:
    -   🟢 **Verde**: < 24 horas.
    -   🟡 **Amarillo**: 24 - 72 horas.
    -   🔴 **Rojo**: > 72 horas.

## 5. Implementación de Referencia (Pseudo-JS)

```javascript
function calculateSLA(submissions) {
  const completed = submissions.filter(s => s.completedAt && s.createdAt);
  if (completed.length === 0) return "N/A";

  const totalHours = completed.reduce((acc, s) => {
    const diff = s.completedAt.toMillis() - s.createdAt.toMillis();
    return acc + (diff / (1000 * 60 * 60));
  }, 0);

  const avg = totalHours / completed.length;
  return avg > 24 ? `${(avg/24).toFixed(1)} días` : `${avg.toFixed(1)} hrs`;
}
```

## 6. Restricciones
Ningún cambio en el código del motor analítico debe desviarse de esta especificación sin una actualización previa de este documento.
