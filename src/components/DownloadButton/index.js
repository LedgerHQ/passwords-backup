import React, { useEffect, useState } from "react";
import './index.css';

function downloadFile(fileData) {
    var blob = new Blob([JSON.stringify(fileData, null, 4)], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var elem = document.createElement("a");
    elem.href = url;
    elem.download = "backup.json";
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}

function DownloadButton({ text, color, onClick }) {
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        if (isLoading) {
            onClick().then((fileData) => {
                console.log(fileData);
                if (fileData) downloadFile(fileData);
                setLoading(false);
            });
        }
    }, [isLoading, onClick]);

    const handleClick = () => {
        setLoading(true);
    }

    return (
        <button
            className="DownloadButton"
            disabled={isLoading}
            onClick={isLoading ? null : handleClick}
            style={{ "margin": "10px", "backgroundColor": color }}
        >
            {isLoading ? 'Loading…' : text}
        </button>
    );
}

export default DownloadButton