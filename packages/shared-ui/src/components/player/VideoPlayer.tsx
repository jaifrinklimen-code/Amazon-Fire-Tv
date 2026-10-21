import React, { useMemo } from 'react';
import Video, { VideoRef } from 'react-native-video';
import { StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { sanitizeMediaUrl, DEFAULT_BACKDROP_FALLBACK } from '../../utils/sanitizeUrl';

interface VideoPlayerProps {
  movie: string;
  headerImage: string;
  paused: boolean;
  controls: boolean;
  onBuffer?: (isBuffering: boolean) => void;
  onProgress?: (currentTime: number) => void;
  onLoad?: (duration: number) => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
}

const VideoPlayer = React.memo(
  React.forwardRef<VideoRef, VideoPlayerProps>(
    (
      {
        movie,
        headerImage,
        paused,
        controls,
        onBuffer,
        onProgress,
        onLoad,
        onEnd,
        onError,
      },
      ref,
    ) => {
      const { width } = useWindowDimensions();

      const safeMovieUrl = useMemo(() => {
        return sanitizeMediaUrl(movie) || movie;
      }, [movie]);

      const safeHeaderUrl = useMemo(() => {
        return sanitizeMediaUrl(headerImage) || DEFAULT_BACKDROP_FALLBACK;
      }, [headerImage]);

      // Memoize source object to prevent unnecessary re-renders
      const videoSource = useMemo(() => ({ uri: safeMovieUrl }), [safeMovieUrl]);



      // Calculate video style based on current dimensions
      const videoStyle = useMemo(
        () => [
          videoPlayerStyles.video,
          { height: width * (9 / 16) },
        ],
        [width],
      );

      return (
        <Video
          ref={ref}
          source={videoSource}
          style={videoStyle}
          controls={controls}
          paused={paused}
          onBuffer={({ isBuffering }: { isBuffering: boolean }) => onBuffer?.(isBuffering)}
          onProgress={({ currentTime }: { currentTime: number }) => onProgress?.(currentTime)}
          onLoad={({ duration }: { duration: number }) => onLoad?.(duration)}
          onEnd={onEnd}
          onError={(err: unknown) => onError?.(err)}
          poster={safeHeaderUrl}
          resizeMode="cover"
        />
      );
    },
  ),
);

const videoPlayerStyles = StyleSheet.create({
  video: {
    width: '100%',
  },
});

export default VideoPlayer;
