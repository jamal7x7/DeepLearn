import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TurtleStyle, TURTLE_STYLES } from '@/lib/turtleStyles';
import { Settings, ChevronDown } from 'lucide-react';

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

  const handleStyleSelect = (styleId: string) => {
    const newStyle = TURTLE_STYLES.find(s => s.id === styleId);
    if (newStyle) {
      // Immediately apply the style change while preserving the current speed
      onStyleChange({ ...newStyle, speed: selectedStyle.speed });
    }
  };

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
            {/* Style Selection Dropdown */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="turtle-style">Style</Label>
              <div className="col-span-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedStyle.name}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {TURTLE_STYLES.map((style) => (
                      <DropdownMenuItem
                        key={style.id}
                        onClick={() => handleStyleSelect(style.id)}
                        className={selectedStyle.id === style.id ? "bg-accent" : ""}
                      >
                        {style.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
