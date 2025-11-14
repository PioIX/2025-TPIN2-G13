/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aca pueden estar tus otras configs

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // --- Tus Headers de CORS (ya los tenías) ---
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
          
          // --- ↓↓↓ HEADERS ANTI-CACHÉ (NUEVOS) ↓↓↓ ---
          // Le decimos al celular que no guarde NADA
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;