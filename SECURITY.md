# SECURITY POLICY

## Descripción General

Este proyecto implementa buenas prácticas básicas de seguridad para proteger la información sensible y garantizar una configuración adecuada del entorno de desarrollo.

El sistema está dividido en tres módulos principales:

* **backend-app**: Lógica del servidor y acceso a datos
* **frontend-app**: Interfaz de usuario
* **Docs**: Documentación del proyecto

---

## Manejo de Variables de Entorno

El proyecto utiliza archivos de entorno para evitar exponer credenciales sensibles en el código fuente.

* Se proporciona un archivo `.env.example` como plantilla
* Cada desarrollador debe crear su propio archivo `.env`
* El archivo `.env` no debe subirse al repositorio
* Las credenciales se cargan mediante variables de entorno

Ejemplo:

.env.example → plantilla sin valores reales
.env → configuración local con credenciales reales

---

## Información Sensible Protegida

Las siguientes configuraciones se manejan mediante variables de entorno:

* Credenciales de Supabase
* Configuración SMTP (correo electrónico)
* Claves de aplicación
* Configuración del servidor
* URLs del frontend
* Variables de entorno del sistema

---

## Control de Versiones Seguro

Se implementan las siguientes prácticas:

* Uso de archivos `.gitignore` en frontend y backend
* Exclusión del archivo `.env` del repositorio
* Separación de frontend y backend
* Configuración por entorno (development / production)

---

## Configuración CORS

El backend utiliza configuración de CORS basada en variables de entorno para limitar el acceso únicamente al frontend autorizado.

Esto evita accesos no autorizados desde otros dominios.

---

## Buenas Prácticas Implementadas

* Separación de responsabilidades frontend/backend
* Uso de variables de entorno
* Exclusión de credenciales del repositorio
* Configuración del servidor por entorno
* Manejo de configuraciones sensibles fuera del código
* Estructura modular del backend

---

## Recomendaciones de Seguridad

Para entornos de producción se recomienda:

* Usar HTTPS
* Rotar credenciales periódicamente
* No compartir archivos `.env`
* Usar claves seguras y aleatorias
* Limitar acceso a APIs mediante autenticación
* Validar entradas del usuario

---

## Reporte de Vulnerabilidades

Si se detecta una vulnerabilidad de seguridad, se recomienda:

1. No exponerla públicamente
2. Reportarla al equipo de desarrollo
3. Corregirla antes del despliegue

---

## Estado de Seguridad

Estado actual: Implementación básica de seguridad aplicada
Nivel: Desarrollo académico / universitario
Configuración: Variables de entorno y separación modular
