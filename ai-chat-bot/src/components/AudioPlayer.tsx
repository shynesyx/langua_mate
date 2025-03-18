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

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, text, language, onPlaybackEnd }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    let isMounted = true;

    const setupAudioEvents = (audio: HTMLAudioElement) => {
      const events = {
        loadedmetadata: () => {
          if (isMounted) {
            setIsLoaded(true);
            setError(null);
            audio.playbackRate = speed;
          }
        },
        canplaythrough: () => {
          if (isMounted) {
            setIsLoaded(true);
            setError(null);
          }
        },
        error: () => {
          if (isMounted) {
            setError('Failed to load audio');
            setIsLoaded(false);
          }
        },
        ended: () => {
          if (isMounted) {
            setIsPlaying(false);
            onPlaybackEnd();
          }
        },
        timeupdate: () => {
          if (isMounted && audio.duration) {
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

    const fetchAudio = async () => {
      if (!text || !language) return;
      
      try {
        setIsLoaded(false);
        setError(null);
        
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_URL}/tts/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language, speed })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to synthesize speech');
        }

        const audioBlob = await response.blob();
        if (audioBlob.size === 0) {
          throw new Error('Received empty audio data');
        }

        if (isMounted) {
          const audio = new Audio();
          const cleanup = setupAudioEvents(audio);
          const audioObjectUrl = URL.createObjectURL(audioBlob);
          
          setAudioSrc(audioObjectUrl);
          audio.src = audioObjectUrl;
          audioRef.current = audio;
          
          return cleanup;
        }
      } catch (err) {
        console.error('Audio fetch error:', err);
        setError('Failed to load audio');
        setIsLoaded(false);
      }
    };

    fetchAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
        setAudioSrc('');
      }
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.load();
      }
      isMounted = false;
      audioRef.current = null;
      setIsPlaying(false);
      setProgress(0);
      setIsLoaded(false);
    };
  }, [text, language, speed, onPlaybackEnd]);

  useEffect(() => {
    setIsLoaded(false);
    setError(null);
  }, [text, language]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newSpeed = parseFloat(e.target.value);
    audio.playbackRate = newSpeed;
    setSpeed(newSpeed);
  };

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