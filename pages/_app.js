import React from 'react';
import { LayoutProvider } from '../layout/context/layoutcontext';
import Layout from '../layout/layout';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/demo/Demos.scss';
import { SessionProvider } from "next-auth/react";
import { PagesProgressBar as ProgressBar } from 'next-nprogress-bar';   

export default function MyApp({ Component, pageProps: {session,...pageProps} }) {
    if (Component.getLayout) {
        return <SessionProvider session={session}><LayoutProvider>{Component.getLayout(<Component {...pageProps} />)}</LayoutProvider> </SessionProvider>;
    } else {
        return (
            <SessionProvider session={session}> 
                <LayoutProvider>
                    <ProgressBar
                        height="4px"
                        color="#4CCD99"
                        options={{ showSpinner: false }}
                        shallowRouting
                    />
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </LayoutProvider>
            </SessionProvider>
        );
    }
}
