import React, { forwardRef } from 'react';

const Video = forwardRef<HTMLVideoElement>((props, ref) => (
  <video ref={ref} autoPlay playsInline style={{ width: '300px', height: '300px' }} />
));

export default Video;