import React from 'react';

interface BorderBeamProps {
  size?: number;
  duration?: number;
  anchor?: number;
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": delay,
        } as React.CSSProperties
      }
      className="pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent] ![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
    >
      <div className="absolute aspect-square w-[calc(var(--size)*1px)] animate-border-beam [animation-delay:calc(var(--delay)*1s)] [background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] [offset-anchor:calc(var(--anchor)*1%)_50%] [offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]" />
    </div>
  );
};
