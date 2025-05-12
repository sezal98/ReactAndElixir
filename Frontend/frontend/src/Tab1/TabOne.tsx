// File: src/App.tsx
import { useState, useEffect } from 'react';
import init, { evaluate_expression } from "../wasm/pkg/wasm_calculator";

function TabOne() {
    const [expression, setExpression] = useState("");
    const [result, setResult] = useState<string | null>(null);

    useEffect(() => {
        init().then(() => console.log("WASM loaded"));
    }, []);

    const handleCalculate = () => {
        try {
            const res = evaluate_expression(expression);
            setResult(res.toString());
        } catch (e) {
            setResult("Error in expression");
        }
    };

    return (
        <div className="flex flex-col items-center p-8 space-y-4">
            <h1 className="text-2xl font-bold">Rust + WASM Calculator</h1>
            <div className="w-full max-w-md">
                <input
                    type="text"
                    placeholder="Enter expression (e.g., 2+2)"
                    value={expression}
                    style={{ width: '-webkit-fill-available' }}
                    onChange={(e) => setExpression(e.target.value)}
                    className="border p-2 w-full text-center border"
                />
            </div>
            <br />
            <div>
                <button
                onClick={handleCalculate}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Calculate
                </button>
            </div>
            {result !== null && <p className="text-lg">Result: {result}</p>}
        </div>
    );
}

export default TabOne;
