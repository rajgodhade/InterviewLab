import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'InterviewLab | AI Interview Simulator',
    short_name: 'InterviewLab',
    description: 'Create and simulate AI-powered interviews with real-time feedback.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0f1d',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
