import React from 'react';
import AppConfig from '../../../layout/AppConfig';

const Restricted = ()=>{
    return (
        <div className="text-center">
                <span className="p-3 shadow-2 mb-3 inline-block surface-card" style={{ borderRadius: '10px' }}>
                    <i className="pi pi-lock text-4xl text-blue-500"></i>
                </span>
                <div className="text-900 mb-3 font-medium">End-to-End Encryption</div>
                
        </div>
    );
}

Restricted.getLayout = function getLayout(page) {
    return (
        <React.Fragment>
            {page}
            <AppConfig/>
        </React.Fragment>
    );
}

export default Restricted;