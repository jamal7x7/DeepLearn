import React, { useEffect, useRef, useState } from 'react';

import { TURTLE_STYLES } from '@/lib/turtleStyles';
import { Turtle } from '@/lib/turtle';

function CanvasCard() {
    const [selectedTurtleDesign, setSelectedTurtleDesign] = useState(TURTLE_STYLES[0]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const turtleRef = useRef<Turtle | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!turtleRef.current) {
            turtleRef.current = new Turtle(selectedTurtleDesign);
        } else {
            turtleRef.current.setStyle(selectedTurtleDesign);
        }

        // Drawing logic would use ctx and turtleRef.current state
        // (implement drawing here if needed)
    }, [selectedTurtleDesign]);

    const handleTurtleDesignChange = (design: typeof TURTLE_STYLES[number]) => {
        setSelectedTurtleDesign(design);
    };

    return (
        <div>
            {/* ... existing canvas and turtle rendering logic ... */}

            {/* Settings Button - you might need to adjust the styling and positioning */}
            <button onClick={() => {/* Open your settings UI here, e.g., a modal or dropdown */ }}>
                Settings {/* Or use an icon */}
            </button>

            {/* Turtle Selection UI (Example - you might use a dropdown or modal) */}
            <div>
                <label htmlFor="turtle-design-select">Choose Turtle:</label>
                <select
                    id="turtle-design-select"
                    value={selectedTurtleDesign.name}
                    onChange={(e) => {
                        const selected = TURTLE_STYLES.find(style => style.name === e.target.value);
                        if (selected) handleTurtleDesignChange(selected);
                    }}
                >
                    {TURTLE_STYLES.map(style => (
                        <option key={style.id} value={style.name}>{style.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default CanvasCard;