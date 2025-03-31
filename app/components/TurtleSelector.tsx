'use client'; // Required for Popover and state interaction

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TurtleStyle, TURTLE_STYLES } from '@/lib/turtleStyles';
import { TurtlePreview } from './TurtlePreview';
import { Check, Palette } from 'lucide-react'; // Icons
import { cn } from '@/lib/utils'; // For conditional classes

interface TurtleSelectorProps {
  currentStyle: TurtleStyle;
  onStyleSelect: (style: TurtleStyle) => void;
}

export const TurtleSelector: React.FC<TurtleSelectorProps> = ({
  currentStyle,
  onStyleSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (style: TurtleStyle) => {
    onStyleSelect(style);
    setIsOpen(false); // Close popover on selection
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Select Turtle Style">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="grid grid-cols-3 gap-2 p-4">
          {TURTLE_STYLES.map((style) => (
            <Button
              key={style.id}
              variant="ghost"
              className={cn(
                'relative h-auto w-auto flex-col justify-center p-2 hover:bg-accent focus:ring-2 focus:ring-ring focus:ring-offset-2',
                currentStyle.id === style.id && 'ring-2 ring-primary'
              )}
              onClick={() => handleSelect(style)}
              aria-label={`Select ${style.name} style`}
            >
              <TurtlePreview style={style} size={40} />
              <span className="mt-1 text-xs">{style.name}</span>
              {currentStyle.id === style.id && (
                <Check className="absolute right-1 top-1 h-4 w-4 text-primary" />
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
