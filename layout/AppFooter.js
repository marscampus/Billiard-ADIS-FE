import getConfig from 'next/config';
import React, { useContext } from 'react';
import { LayoutContext } from './context/layoutcontext';

const AppFooter = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const contextPath = getConfig().publicRuntimeConfig.contextPath;
    const version = getConfig().publicRuntimeConfig.version;

    return (
        <div className="layout-footer">
            {/* <img src={`${contextPath}/layout/images/2x1.png`} width="auto" height={'40px'} /> */}
            {/* <img src={`${contextPath}/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`} alt="Logo" height="20" className="mr-2" /> */}
            ver.
            <span className="font-medium ml-2">{version}</span>
        </div>
    );
};

export default AppFooter;
