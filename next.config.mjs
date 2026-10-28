/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    localPatterns: [
      // Images that ship with the site.
      { pathname: "/img/**", search: "" },
      // The profile photo uploaded in Admin → Content; ?v= changes with every upload.
      { pathname: "/api/site-photo/**" },
    ],
  },
};

export default nextConfig;
