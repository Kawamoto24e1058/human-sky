import { useEffect, useMemo, useState } from 'react';
// @ts-ignore - tsparticles型定義の一時的な問題を回避
import Particles, { initParticlesEngine } from '@tsparticles/react';
// @ts-ignore
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';

export function BackgroundParticles() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo(
    () => ({
      background: {
        color: {
          value: 'transparent'
        }
      },
      fpsLimit: 60,
      particles: {
        color: {
          value: ['#4af0ff', '#c084fc', '#ffffff']
        },
        links: {
          enable: false
        },
        move: {
          enable: true,
          speed: 0.5,
          direction: 'top' as const,
          random: true,
          straight: false,
          outModes: {
            default: 'out' as const
          }
        },
        number: {
          value: 80,
          density: {
            enable: true,
            width: 1920,
            height: 1080
          }
        },
        opacity: {
          value: { min: 0.1, max: 0.6 },
          animation: {
            enable: true,
            speed: 0.5,
            sync: false
          }
        },
        shape: {
          type: 'circle'
        },
        size: {
          value: { min: 1, max: 3 }
        },
        twinkle: {
          particles: {
            enable: true,
            frequency: 0.05,
            opacity: 1
          }
        }
      },
      detectRetina: true
    }),
    []
  );

  if (!init) {
    return null;
  }

  return (
    <Particles
      id="tsparticles"
      options={options}
      className="absolute inset-0 pointer-events-none"
    />
  );
}
