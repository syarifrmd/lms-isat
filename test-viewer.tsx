import { createRoot } from 'react-dom/client';
import { PDFViewer } from '@embedpdf/react-pdf-viewer';
import React from 'react';

function App() {
    return (
        <PDFViewer 
            config={{ src: 'http://localhost/demo.pdf' }}
            onReady={(r) => { 
                console.log(r); 
                window.testRegistry = r;
            }} 
        />
    );
}
// just to compile it to see types
