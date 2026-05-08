# Documento de Diseño: Mesa de Entrada Digital & Dashboard GALA

Este documento describe la arquitectura, decisiones de diseño y modelos de datos del ecosistema GALA, siguiendo los estándares de Google Labs.

## 1. Introducción
La Mesa de Entrada Digital es una plataforma institucional diseñada para la gestión de trámites estudiantiles y el monitoreo estratégico de la calidad educativa mediante el sistema de Excelencia Académica.

## 2. Arquitectura del Sistema
El sistema utiliza una arquitectura **Serverless** basada en:
- **Frontend**: Next.js (App Router) para una experiencia de usuario rápida y reactiva.
- **Backend-as-a-Service**: Firebase (Firestore, Auth) para la gestión de datos en tiempo real y seguridad.
- **Arquitectura de Skills**: Lógica de negocio encapsulada en módulos independientes para facilitar la escalabilidad y mantenimiento.

### 2.1. Separación de Portales
- **Portal Público**: Acceso abierto para estudiantes. Permite el envío de trámites y evaluaciones de cátedras. No requiere autenticación para maximizar la participación, pero utiliza validaciones de seguridad para prevenir abusos.
- **Dashboard GALA (/admin)**: Portal restringido para la gestión institucional. Requiere autenticación mediante Firebase Auth para acceder a datos sensibles y métricas consolidadas.

## 3. Modelo de Datos de Excelencia Académica
El núcleo del sistema de monitoreo se basa en cuatro ejes estratégicos (Índices):

| Índice | Definición | Aplicación |
| :--- | :--- | :--- |
| **ICT** | Índice de Claridad Transmisiva | Capacidad de la cátedra para transmitir conocimientos de forma clara. |
| **NDC** | Nivel de Digitalización | Integración del campus virtual y organización de materiales. |
| **CAT** | Apoyo a la Trayectoria | Compromiso humano, empatía y seguimiento del estudiante. |
| **TCE** | Coherencia Evaluativa | Justicia y alineación entre lo enseñado y lo evaluado. |

### 3.1. Semáforo de Gestión
Se utiliza un sistema de visualización de "semáforo" para facilitar la detección de áreas críticas:
- 🟢 **Excelente (3.8 - 5.0)**: Desempeño destacado.
- 🟡 **Aceptable (2.6 - 3.7)**: Áreas con oportunidad de mejora.
- 🔴 **Crítico (1.0 - 2.5)**: Intervención institucional recomendada.

## 4. Decisiones de Diseño (ADRs)
- **Uso de Firebase Auth**: Reemplazo del sistema de PIN por autenticación robusta para cumplir con estándares de seguridad modernos.
- **Inmutabilidad de Evaluaciones**: Las evaluaciones enviadas por estudiantes son inmutables para garantizar la integridad de las métricas.
- **Exportación a Excel**: Herramienta estratégica para el análisis offline y archivo histórico institucional.
