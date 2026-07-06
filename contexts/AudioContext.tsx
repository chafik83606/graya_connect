import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert } from 'react-native';

import type { Track } from '../lib/types';

type AudioContextValue = {
  currentTrack: Track | null;
  isPlaying: boolean;
  status: AudioStatus | null;
  playTrack: (track: Track) => Promise<void>;
  togglePlayPause: () => void;
  stop: () => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [status, setStatus] = useState<AudioStatus | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);

    const player = createAudioPlayer(null);
    playerRef.current = player;

    const subscription = player.addListener('playbackStatusUpdate', (nextStatus) => {
      setStatus(nextStatus);
    });

    return () => {
      subscription.remove();
      player.remove();
      playerRef.current = null;
    };
  }, []);

  const playTrack = useCallback(async (track: Track) => {
    const player = playerRef.current;
    if (!player) return;

    if (!track.audio_url) {
      Alert.alert('Indisponible', 'Ce morceau n\'a pas encore de fichier audio.');
      return;
    }

    if (currentTrack?.id === track.id) {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
      return;
    }

    player.replace(track.audio_url);
    player.play();
    setCurrentTrack(track);
  }, [currentTrack]);

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player || !currentTrack) return;

    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [currentTrack]);

  const stop = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    player.pause();
    player.seekTo(0);
    setCurrentTrack(null);
  }, []);

  const value = useMemo<AudioContextValue>(
    () => ({
      currentTrack,
      isPlaying: status?.playing ?? false,
      status,
      playTrack,
      togglePlayPause,
      stop,
    }),
    [currentTrack, status, playTrack, togglePlayPause, stop],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}
