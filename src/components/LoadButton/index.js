import React, { useEffect, useRef, useCallback, useState } from "react";
import './index.css';

function LoadButton({ text, color, onClick }) {
    const [isLoading, setLoading] = useState(false);
    const [fileData, setFileData] = useState();
    const file = useRef(null);

    useEffect(() => {
        if (isLoading) {
            onClick(fileData).then(() => {
                setLoading(false);
            });
        }
    }, [isLoading, fileData, onClick]);

    const onTriggerFileSelect = useCallback(() => {
        file.current && file.current.click();
    }, []);

    const onSelectedFileChanged = useCallback((event) => {
        event.target.files[0].text().then((text) => {
            event.target.value = '';
            setFileData(text);
            setLoading(true);
        });
    }, []);

    return (
        <button
            className="LoadButton"
            disabled={isLoading}
            onClick={isLoading ? null : onTriggerFileSelect}
            style={{ "margin": "10px", "backgroundColor": color }}
        >
            {isLoading ? 'Loading…' : text}
            <input
                id={`selectedFile_${text}`}
                type="file"
                ref={file}
                onChange={onSelectedFileChanged}
                accept=".json"
                style={{ "display": "none" }}
            />
        </button>
    );
}

export default LoadButton