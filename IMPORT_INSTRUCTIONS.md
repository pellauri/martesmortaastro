# Importación de Posts desde WordPress

Este documento explica cómo importar posts antiguos desde un archivo de exportación de WordPress.

## Prerrequisitos

- Node.js instalado
- Archivo XML de exportación de WordPress (`martesdemorta.WordPress.2024-06-05.xml`)

## Instrucciones

### 1. Obtener el archivo XML

Descarga el archivo de exportación de WordPress desde:
https://github.com/pellauri/mortabackup/blob/import-wp/martesdemorta.WordPress.2024-06-05.xml

Guárdalo en la raíz del proyecto.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Ejecutar el script de importación

```bash
npm run import-wordpress martesdemorta.WordPress.2024-06-05.xml
```

O directamente:

```bash
node import-wordpress.js martesdemorta.WordPress.2024-06-05.xml
```

## ¿Qué hace el script?

El script realiza las siguientes operaciones:

1. **Lee el archivo XML** de exportación de WordPress
2. **Extrae solo los posts publicados** (omite páginas y borradores)
3. **Analiza cada post** para extraer:
   - Título y fecha de publicación original
   - Lista de asistentes
   - Sede/lugar del evento
   - Imagen destacada
4. **Crea archivos Markdown** en `src/content/blog/Martes/{año}/` con la estructura:
   ```markdown
   ---
   title: 'N° Martes DD/MM/YYYY'
   description: 'N° Martes DD/MM/YYYY'
   pubDate: 'Mon DD YYYY'
   heroImage: '/Martes/{año}/{archivo}.jpg'
   ---
   
   # Asistentes
   
   - Nombre 1
   - Nombre 2
   
   # Sede
   
   Nombre del lugar
   
   ![blog placeholder](/Martes/{año}/{archivo}.jpg)
   ```
5. **Descarga las imágenes** a `public/Martes/{año}/`
6. **Mantiene la fecha original** de cada post para consistencia histórica
7. **Omite enlaces de Google Maps** según lo solicitado

## Estructura de directorios creada

```
src/content/blog/Martes/
├── 2022/
│   ├── 2022_1.md
│   ├── 2022_2.md
│   └── ...
├── 2023/
│   ├── 2023_1.md
│   ├── 2023_2.md
│   └── ...
└── 2024/
    ├── 2024_1.md (ya existentes)
    └── ...

public/Martes/
├── 2022/
│   ├── 2022_1.jpg
│   ├── 2022_2.jpg
│   └── ...
├── 2023/
│   ├── 2023_1.jpg
│   ├── 2023_2.jpg
│   └── ...
└── 2024/
    ├── 2024_1.jpg (ya existentes)
    └── ...
```

## Después de la importación

1. **Revisar los archivos generados** en `src/content/blog/Martes/`
2. **Verificar las imágenes** en `public/Martes/`
3. **Ajustar manualmente** cualquier post que necesite correcciones
4. **Construir el sitio** para verificar que todo funciona:
   ```bash
   npm run build
   ```
5. **Vista previa local**:
   ```bash
   npm run preview
   ```

## Solución de problemas

### El script no encuentra el archivo XML

Asegúrate de que el archivo está en la ubicación correcta y que el nombre es exacto.

### Faltan imágenes

Si alguna imagen no se descarga automáticamente, añádela manualmente a la carpeta correspondiente en `public/Martes/{año}/`.

### Formato de contenido incorrecto

El script intenta detectar automáticamente la estructura de los posts antiguos. Si algún post no se importa correctamente, puedes editarlo manualmente siguiendo el formato de los posts de 2024.

## Notas importantes

- **Solo se importan posts publicados**, no páginas ni borradores
- **Se mantienen las fechas originales** de publicación
- **Los enlaces de Google Maps se omiten** automáticamente
- **Los posts se numeran secuencialmente** por año
