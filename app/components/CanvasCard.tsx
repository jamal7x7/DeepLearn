import React, { useEffect, useRef, useState } from 'react';
import { TURTLE_DESIGNS } from '@/lib/turtle';

function CanvasCard() {
    const [selectedTurtleDesign, setSelectedTurtleDesign] = useState(TURTLE_DESIGNS[0]);
    const canvasRef = useRef(null);
    const turtleRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!turtleRef.current) {
            turtleRef.current = new Turtle(ctx);
        }

        turtleRef.current.setDesign(selectedTurtleDesign);
    }, [selectedTurtleDesign]);

    const handleTurtleDesignChange = (design) => {
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
                        const selectedDesign = TURTLE_DESIGNS.find(d => d.name === e.target.value);
                        if (selectedDesign) {
                            handleTurtleDesignChange(selectedDesign);
                        }
                    }}
                >
                    {TURTLE_DESIGNS.map((design) => (
                        <option key={design.name} value={design.name}>
                            {design.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default CanvasCard; 