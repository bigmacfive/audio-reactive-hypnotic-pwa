import React, { useState, useEffect, useRef } from 'react';

const AudioReactiveHypnotic = () => {
  const [patterns, setPatterns] = useState([]);
  const [spiralAngle, setSpiralAngle] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);

  const getRandomColor = () => `hsl(${Math.random() * 360}, 100%, 50%)`;

  const generatePattern = (index) => ({
    background: `
      repeating-radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, 
      ${getRandomColor()}, ${getRandomColor()} ${5 + Math.random() * 10}px, 
      ${getRandomColor()} ${10 + Math.random() * 20}px)
    `,
    animation: `
      spin ${(3 + Math.random() * 7) / animationSpeed}s linear infinite,
      pulse ${(1 + Math.random() * 2) / animationSpeed}s ease-in-out infinite alternate,
      moveAround ${(10 + Math.random() * 20) / animationSpeed}s ease-in-out infinite
    `,
    opacity: 0.7 + Math.random() * 0.3,
    mixBlendMode: ['difference', 'screen', 'overlay', 'color-dodge', 'color-burn'][Math.floor(Math.random() * 5)],
    zIndex: index,
  });

  useEffect(() => {
    const updatePatterns = () => {
      setPatterns(Array(10).fill().map((_, i) => generatePattern(i)));
    };
    updatePatterns();
    const intervalId = setInterval(updatePatterns, 2000 / animationSpeed);
    const spiralId = setInterval(() => setSpiralAngle(prev => (prev + 5 * animationSpeed) % 360), 16);

    return () => {
      clearInterval(intervalId);
      clearInterval(spiralId);
    };
  }, [animationSpeed]);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const updateAnimationSpeed = () => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);

          // Focus on lower frequencies (bass and kick)
          const bassEnergy = dataArray.slice(0, 10).reduce((sum, value) => sum + value, 0) / 10;
          const normalizedBassEnergy = bassEnergy / 255; // Normalize to 0-1 range
          setAnimationSpeed(1 + normalizedBassEnergy * 5); // Scale animation speed

          requestAnimationFrame(updateAnimationSpeed);
        };

        updateAnimationSpeed();
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.5); }
        }
        @keyframes moveAround {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(100px, 100px); }
          50% { transform: translate(0, 200px); }
          75% { transform: translate(-100px, 100px); }
        }
        @keyframes spiral {
          0% { transform: rotate(0deg) scale(0); }
          100% { transform: rotate(360deg) scale(1); }
        }
      `}</style>
      {patterns.map((style, index) => (
        <div key={index} className="absolute inset-0" style={style} />
      ))}
      <div 
        className="absolute inset-0"
        style={{
          background: `conic-gradient(from ${spiralAngle}deg, black, white)`,
          animation: `spin ${5 / animationSpeed}s linear infinite`,
          mixBlendMode: 'difference',
        }}
      />
      {Array(100).fill().map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `spiral ${(2 + Math.random() * 8) / animationSpeed}s linear infinite`,
            animationDelay: `${Math.random() * -8}s`,
          }}
        />
      ))}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default AudioReactiveHypnotic;