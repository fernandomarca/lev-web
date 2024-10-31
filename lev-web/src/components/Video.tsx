import React, { forwardRef } from 'react';

const Video = forwardRef<HTMLVideoElement>((props, ref) => (
  <video ref={ref} autoPlay playsInline style={{ width: '300px', height: '300px' }} />
));

Video.displayName = 'Video';

export default Video;

interface VideoPlayerProps extends React.HTMLProps<HTMLVideoElement> {
  stream: MediaStream | null
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ stream, ...rest }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <Video ref={videoRef} {...rest} />;
}