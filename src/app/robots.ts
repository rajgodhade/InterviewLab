import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/auth/',
        '/login/',
        '/student/dashboard/',
        '/interview/',
      ],
    },
    sitemap: 'https://interviewlab-ai.vercel.app/sitemap.xml',
  };
}
