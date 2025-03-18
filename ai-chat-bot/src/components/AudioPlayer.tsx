import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlay, FaStop } from 'react-icons/fa';

interface AudioPlayerProps {
  audioUrl: string;
  text: string;
  language: string;
  onPlaybackEnd: () => void;
}

const PlayerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 300px;
  margin-top: 8px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PlayButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.hover};
  }

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
  text-align: center;
`;

const ProgressBar = styled.input`
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  background: #e0e0e0;
  border-radius: 2px;
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    cursor: pointer;
  }

  &:hover {
    opacity: 1;
  }
`;

const SpeedControl = styled.select`
  padding: 2px 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  background-color: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, onPlaybackEnd }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const setupAudioEvents = (audio: HTMLAudioElement) => {
    const events = {
      loadedmetadata: () => {
        setIsLoaded(true);
        setError(null);
        audio.playbackRate = speed;
      },
      canplaythrough: () => {
        setIsLoaded(true);
        setError(null);
      },
      error: () => {
        setError('Failed to load audio');
        setIsLoaded(false);
      },
      ended: () => {
        setIsPlaying(false);
        onPlaybackEnd();
      },
      timeupdate: () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      }
    };

    Object.entries(events).forEach(([event, handler]) => {
      audio.addEventListener(event, handler);
    });

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler);
      });
    };
  };

  useEffect(() => {
    if (!audioUrl) return;

    const audio = audioRef.current || new Audio();
    const cleanup = setupAudioEvents(audio);
    
    audio.src = audioUrl;
    audioRef.current = audio;
    
    return () => {
      cleanup();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [audioUrl, speed]);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError('Failed to play audio');
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newProgress = parseFloat(e.target.value);
    const newTime = (newProgress / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress(newProgress);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!audioRef.current) return;
    const newSpeed = parseFloat(e.target.value);
    audioRef.current.playbackRate = newSpeed;
    setSpeed(newSpeed);
  };

  if (!audioUrl) {
    return null;
  }

  return (
    <PlayerContainer>
      <Controls>
        <PlayButton onClick={handlePlayPause} disabled={!isLoaded || !!error}>
          {isPlaying ? <FaStop size={16} /> : <FaPlay size={16} />}
        </PlayButton>
        <ProgressBar
          type="range"
          min={0}
          max={100}
          value={progress}
          disabled={!isLoaded}
          onChange={(e) => {
            if (audioRef.current) {
              const newTime = (parseFloat(e.target.value) / 100) * audioRef.current.duration;
              audioRef.current.currentTime = newTime;
            }
          }}
        />
        <SpeedControl value={speed} onChange={handleSpeedChange}>
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </SpeedControl>
      </Controls>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </PlayerContainer>
  );
};

export default AudioPlayer;