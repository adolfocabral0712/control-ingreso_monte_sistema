const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Access-Control-Allow-Origin": "*",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ========================================================
    // RESPUESTA PARA SOLICITUDES OPTIONS
    // ========================================================

    if (
      request.method === "OPTIONS" &&
      url.pathname === "/api/datos"
    ) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // ========================================================
    // API DE DATOS
    // ========================================================

    if (url.pathname === "/api/datos") {
      if (request.method !== "GET") {
        return jsonResponse(
          {
            error: "Método no permitido",
          },
          405
        );
      }

      if (!env.PREDIOS_JSON_URL) {
        return jsonResponse(
          {
            error: "Falta configurar el Secret PREDIOS_JSON_URL",
          },
          500
        );
      }

      try {
        const separador = env.PREDIOS_JSON_URL.includes("?")
          ? "&"
          : "?";

        const urlOrigen =
          `${env.PREDIOS_JSON_URL}${separador}_=${Date.now()}`;

        const respuesta = await fetch(urlOrigen, {
          method: "GET",

          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },

          cf: {
            cacheEverything: false,
            cacheTtl: 0,
          },
        });

        if (!respuesta.ok) {
          return jsonResponse(
            {
              error: "No se pudo obtener el JSON de origen",
              estado: respuesta.status,
            },
            502
          );
        }

        const datos = await respuesta.json();

        return jsonResponse(datos);
      } catch (error) {
        return jsonResponse(
          {
            error: "No se pudo consultar la información",
            detalle:
              error instanceof Error
                ? error.message
                : String(error),
          },
          502
        );
      }
    }

    // ========================================================
    // ARCHIVOS ESTÁTICOS: HTML, CSS, ETC.
    // ========================================================

    return env.ASSETS.fetch(request);
  },
};
