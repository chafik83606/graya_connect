import type { Event, Post, Profile, Track } from './types';

export const GRAYA_PROFILE: Profile = {
  id: 'graya',
  username: 'graya',
  display_name: 'Graya',
  bio: 'Rappeur · Artiste · Graya Connect',
  avatar_url: null,
  is_artist: true,
  followers_count: 48200,
  following_count: 128,
  created_at: '2024-01-01T00:00:00Z',
};

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    user_id: 'graya',
    content: 'Nouveau son en approche. Restez connectés. 🔥',
    image_url: null,
    likes_count: 1240,
    comments_count: 89,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    profile: GRAYA_PROFILE,
  },
  {
    id: '2',
    user_id: 'fan1',
    content: 'Graya au top ! Hâte de voir la prochaine sortie 💯',
    image_url: null,
    likes_count: 42,
    comments_count: 5,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    profile: {
      id: 'fan1',
      username: 'fan_marseille',
      display_name: 'Fan Marseille',
      bio: null,
      avatar_url: null,
      is_artist: false,
      followers_count: 120,
      following_count: 45,
      created_at: '2024-06-01T00:00:00Z',
    },
  },
  {
    id: '3',
    user_id: 'graya',
    content: 'Merci pour le soutien sur le dernier clip. Vous êtes incroyables.',
    image_url: null,
    likes_count: 3100,
    comments_count: 201,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    profile: GRAYA_PROFILE,
  },
];

export const MOCK_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Dernière sortie',
    artist: 'Graya',
    cover_url: null,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    release_date: '2025-11-15',
    plays_count: 125000,
  },
  {
    id: '2',
    title: 'Freestyle #12',
    artist: 'Graya',
    cover_url: null,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    release_date: '2025-09-01',
    plays_count: 89000,
  },
  {
    id: '3',
    title: 'En studio',
    artist: 'Graya',
    cover_url: null,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    release_date: '2025-06-20',
    plays_count: 67000,
  },
];

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Concert — Paris',
    location: 'La Cigale, Paris',
    event_date: '2026-03-15T20:00:00Z',
    image_url: null,
  },
  {
    id: '2',
    title: 'Meet & Greet Fans',
    location: 'Marseille',
    event_date: '2026-04-02T18:00:00Z',
    image_url: null,
  },
];
