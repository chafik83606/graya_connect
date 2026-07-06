import { supabase } from '../supabase';
import type { Event, Track } from '../types';

export type CreateEventInput = {
  title: string;
  location: string;
  eventDate: string;
  ticketUrl?: string | null;
};

export type CreateTrackInput = {
  title: string;
  audioUrl?: string | null;
  releaseDate: string;
};

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: input.title.trim(),
      location: input.location.trim(),
      event_date: input.eventDate,
      ticket_url: input.ticketUrl?.trim() || null,
    })
    .select('id, title, location, event_date, image_url, ticket_url')
    .single();

  if (error) throw error;
  return data as Event;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw error;
}

export async function fetchAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, location, event_date, image_url, ticket_url')
    .order('event_date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Event[];
}

export async function createTrack(input: CreateTrackInput): Promise<Track> {
  const { data, error } = await supabase
    .from('tracks')
    .insert({
      title: input.title.trim(),
      artist: 'Graya',
      audio_url: input.audioUrl?.trim() || null,
      release_date: input.releaseDate,
    })
    .select('id, title, artist, cover_url, audio_url, release_date, plays_count')
    .single();

  if (error) throw error;
  return data as Track;
}

export async function deleteTrack(trackId: string): Promise<void> {
  const { error } = await supabase.from('tracks').delete().eq('id', trackId);
  if (error) throw error;
}

export async function fetchAllTracks(): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select('id, title, artist, cover_url, audio_url, release_date, plays_count')
    .order('release_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Track[];
}
