export type NewsArticle = {
  id: string;
  title: string;
  summary: string | null;
  url: string | null;
  source: string | null;
  image_url: string | null;
  published_at: string;
  is_auto?: boolean;
};

export type LiveSession = {
  id: string;
  title: string;
  youtube_video_id: string | null;
  youtube_url: string | null;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  source?: 'artist' | 'youtube';
  thumbnail_url?: string | null;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
};

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_artist: boolean;
  followers_count: number;
  following_count: number;
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: Profile;
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  audio_url: string | null;
  release_date: string;
  plays_count: number;
};

export type Event = {
  id: string;
  title: string;
  location: string;
  event_date: string;
  image_url: string | null;
  ticket_url?: string | null;
};

export type CommunityGroup = {
  id: string;
  name: string;
  description?: string | null;
  member_count: number;
  is_member?: boolean;
};

export type GroupMessage = {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
};

export type OfficialChatMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
};

export type Conversation = {
  id: string;
  other_user_id: string;
  participant_name: string;
  participant_avatar: string | null;
  last_message: string;
  last_message_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type UserSettings = {
  user_id: string;
  notify_new_releases: boolean;
};
