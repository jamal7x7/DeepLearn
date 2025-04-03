import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'; // Adjust import path if needed
import { Button } from '@/components/ui/button'; // Adjust import path if needed
import { Label } from '@/components/ui/label'; // Adjust import path if needed
import { Slider } from '@/components/ui/slider'; // Adjust import path if needed
import { TurtleStyle, TURTLE_STYLES } from '@/lib/turtleStyles'; // Adjust import path if needed
import { Settings } from 'lucide-react'; // Example icon

interface LogoStylePopupProps {
  selectedStyle: TurtleStyle;
  onStyleChange: (newStyle: TurtleStyle) => void;
}

export function LogoStylePopup({
  selectedStyle,
  onStyleChange,
}: LogoStylePopupProps) {
  const handleSpeedChange = (value: number[]) => {
    const newSpeed = value[0];
    if (newSpeed !== undefined) {
      onStyleChange({ ...selectedStyle, speed: newSpeed });
    }
  };

  // TODO: Implement style selection (e.g., dropdown or radio group)
  // const handleStyleSelect = (styleId: string) => {
  //   const newStyle = TURTLE_STYLES.find(s => s.id === styleId);
  //   if (newStyle) {
  //     onStyleChange({ ...newStyle, speed: selectedStyle.speed }); // Keep current speed when changing style
  //   }
  // };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Turtle Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Turtle Settings</h4>
            <p className="text-sm text-muted-foreground">
              Customize the turtle's appearance and animation speed.
            </p>
          </div>
          <div className="grid gap-2">
            {/* Placeholder for Style Selection */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="turtle-style">Style</Label>
              <div className="col-span-2">
                {/* Replace with actual style selector */}
                <span className="text-sm text-muted-foreground">
                  {selectedStyle.name} (Selector TBD)
                </span>
              </div>
            </div>

            {/* Speed Slider */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="speed-slider">Speed</Label>
              <Slider
                id="speed-slider"
                min={1}
                max={10}
                step={1}
                value={[selectedStyle.speed]}
                onValueChange={handleSpeedChange}
                className="col-span-2"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <div></div> {/* Empty cell for alignment */}
              <span className="col-span-2 text-xs text-muted-foreground text-right">
                Speed: {selectedStyle.speed}
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
