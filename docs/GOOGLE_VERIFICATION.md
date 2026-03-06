# Verificación de Propiedad del Sitio en Google Search Console

Para completar la verificación requerida por Google OAuth, necesitás verificar la propiedad de tu sitio web `https://ombu-polideportivo.vercel.app/` en Google Search Console.

## Pasos para Verificar la Propiedad

### 1. Acceder a Google Search Console
1. Ve a [Google Search Console](https://search.google.com/search-console)
2. Inicia sesión con la misma cuenta de Google que usaste para crear el proyecto OAuth

### 2. Agregar la Propiedad
1. Haz clic en "Agregar propiedad"
2. Selecciona **"Prefijo de URL"**
3. Ingresa: `https://ombu-polideportivo.vercel.app/`
4. Haz clic en "Continuar"

### 3. Verificar la Propiedad (Método Recomendado: Archivo HTML)

Google te ofrecerá varios métodos de verificación. El más simple es **subir un archivo HTML**:

#### Opción A: Archivo HTML de verificación
1. Google te dará un archivo HTML para descargar (algo como `google1234567890abcdef.html`)
2. Este archivo debe estar disponible en la raíz de tu sitio: `https://ombu-polideportivo.vercel.app/google1234567890abcdef.html`

**Cómo implementarlo:**
- Coloca el archivo en `/public/` de tu proyecto Next.js
- Ejemplo: `/public/google1234567890abcdef.html`
- Next.js automáticamente servirá este archivo desde la raíz del sitio
- Haz commit y push a GitHub
- Vercel lo desplegará automáticamente

```bash
# Ejemplo de comandos
mv ~/Downloads/google1234567890abcdef.html ./public/
git add public/google1234567890abcdef.html
git commit -m "Add Google Search Console verification file"
git push
```

#### Opción B: Meta tag HTML (Alternativa)
Si preferís usar un meta tag en lugar de un archivo:

1. Google te dará un meta tag como:
   ```html
   <meta name="google-site-verification" content="abc123xyz..." />
   ```

2. Agregar este tag al layout principal del sitio:

**Archivo a modificar: `/src/app/layout.tsx`**

Busca el `<head>` y agrega el meta tag dentro del componente `Metadata` o directamente en el HTML:

```tsx
export const metadata: Metadata = {
  // ... otros metadatos
  verification: {
    google: 'abc123xyz...' // Reemplaza con tu código
  }
}
```

O si no funciona con metadata, agrega directamente en el head usando un componente:

```tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="google-site-verification" content="abc123xyz..." />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

### 4. Completar la Verificación
1. Una vez que el archivo esté desplegado en Vercel (o el meta tag agregado)
2. Vuelve a Google Search Console
3. Haz clic en "Verificar"
4. Si todo está correcto, verás un mensaje de éxito ✅

## Después de Verificar

Una vez verificado el sitio:
1. Vuelve a la consola de Google Cloud (OAuth Consent Screen)
2. Actualiza la información si es necesario
3. Intenta enviar nuevamente la solicitud de verificación

Google debería ahora reconocer que:
- ✅ El sitio está verificado a tu nombre
- ✅ El sitio incluye un enlace a la política de privacidad (ya agregado en el footer)

## Problemas Comunes

### El archivo no se encuentra (404)
- Verifica que el archivo esté en `/public/` (no en subcarpetas)
- Asegúrate de que Vercel haya completado el deployment
- Prueba acceder directamente: `https://ombu-polideportivo.vercel.app/google1234567890abcdef.html`

### La verificación falla
- Espera unos minutos después del deployment
- Limpia la caché del navegador
- Intenta con el método de meta tag en su lugar

### Dominio personalizado
Si en el futuro usás un dominio personalizado (ej: `ombu.com`):
- Tendrás que repetir el proceso de verificación para el nuevo dominio
- Actualizar la URL en la consola de OAuth de Google Cloud

## Recursos Adicionales
- [Documentación de Google Search Console](https://support.google.com/webmasters/answer/9008080)
- [Verificación de sitios en Next.js](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#verification)
