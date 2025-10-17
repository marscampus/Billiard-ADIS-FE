import getConfig from 'next/config';
import Link from 'next/link';
import Router, { useRouter } from 'next/router';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { LayoutContext } from './context/layoutcontext';
import { OverlayPanel } from 'primereact/overlaypanel';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { Menu } from 'primereact/menu';
import { Toast } from 'primereact/toast';
const QRCode = require('qrcode');

const AppTopbar = forwardRef((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const contextPath = getConfig().publicRuntimeConfig.contextPath;
    const op = useRef(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const menu = useRef(null);
    const qr = useRef(null);
    const toast = useRef(null);
    const [pluginResto, setPluginResto] = useState(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    const router = useRouter();
    const toggleprofile = () => {
        router.push('/profile');
    };

    const onClickLogout = () => {
        const local = window.location.origin;
        signOut({ callbackUrl: `${local}/login` });
    };

    // Yang Handle Konversi
    const handleMenuItemClick = (href) => {
        setMenuVisible(false);
        router.push(href);
    };

    const overlayMenuItems = [
        {
            label: 'Konversi Stock',
            icon: 'pi pi-th-large',
            command: () => handleMenuItemClick('/konversi/stock')
        }
    ];

    const showMenu = (event) => {
        menu.current.show(event);
    };

    const { data: session, status } = useSession();

    // useEffect(() => {
    //     const email = session?.user?.email;
    //     if (email) {
    //         async function getPluginResto(email) {
    //             try {
    //                 const res = await fetch('/api/getPluginResto', {
    //                     method: 'POST',
    //                     headers: {
    //                         'Content-Type': 'application/json'
    //                     },
    //                     body: JSON.stringify({ email }) // Mengirim payload dalam format JSON
    //                 });

    //                 if (!res.ok) {
    //                     setPluginResto(null);
    //                     return;
    //                 }
    //                 const result = await res.json();

    //                 const plugin = result.data.filter((item) => item.id === '9ceb4d54-19d0-47c6-ac7f-f0905bdc9a26');
    //                 setPluginResto(plugin[0]);
    //             } catch (error) {
    //                 setPluginResto(null);
    //             }
    //         }
    //         getPluginResto(email);
    //     }
    // }, [session]);

    const createQRCode = async () => {
        try {
            const res = await fetch('/api/generateQRCode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    id_user: pluginResto?.id_user,
                    id_plugin: pluginResto?.id
                })
            });

            if (!res.ok) {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal Membuat QRCODE', life: 3000 });
                return;
            }

            const data = await res.json();
            const link = document.createElement('a');
            link.href = data.qrCode;
            link.download = 'qrcode-resto.png';
            link.click();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal Mendownload QRCODE', life: 3000 });
            console.error('Error download QR code:', error);
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="layout-topbar">
                <Link href="/" className="layout-topbar-logo" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img src={`${contextPath}/layout/images/billiard-removebg.png`} width="auto" height={'60px'} />
                    {/* <span>GODONG</span> */}
                </Link>

                <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                    <i className="pi pi-bars" />
                </button>

                <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                    <i className="pi pi-ellipsis-v" />
                </button>

                <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                    {/* {pluginResto && Object.keys(pluginResto || {}).length > 0 && (
                        <button type="button" className="p-link layout-topbar-button mx-1" onClick={(e) => qr.current.toggle(e)}>
                            <i className="pi pi-qrcode"></i>
                            <span>QRCode Resto</span>
                        </button>
                    )}
                    <OverlayPanel ref={qr}>
                        <span className="p-link" onClick={() => createQRCode()}>
                            Create
                        </span>
                    </OverlayPanel> */}
                    <div className="flex align-items-center">
                        <div className="text-700">{session?.user?.name}</div>
                    </div>
                    {/* <button type="button" onClick={toggleprofile} className="p-link layout-topbar-button">
                    <i className="pi pi-user"></i>
                    <span>Profile</span>
                </button> */}
                    {/* <OverlayPanel ref={op} appendTo={typeof window !== 'undefined' ? document.body : null}>
                    <span className='p-link' onClick={()=>signOut()}>Logout</span>
                    </OverlayPanel> */}
                    <button type="button" onClick={(e) => op.current.toggle(e)} className="p-link layout-topbar-button">
                        <i className="pi pi-user"></i>
                        <span>Log Out</span>
                    </button>
                    <OverlayPanel ref={op}>
                        {/* <Link href="/profile">
                        <span className="p-link">Profile</span>
                        </Link>
                        <hr></hr> */}
                        <span className="p-link" onClick={() => onClickLogout()}>
                            Log out
                        </span>
                    </OverlayPanel>
                    <Menu ref={menu} model={overlayMenuItems} popup />
                    {/* <button type="button" className="p-link layout-topbar-button" onClick={(e) => showMenu(e)}>
                        <i className="pi pi-database" />
                        <span>Konversi</span>
                    </button> */}

                    {/* <Link href="/profile">
					<button type="button" className="p-link layout-topbar-button">
						<i className="pi pi-cog"></i>
						<span>Settings</span>
                        </button>
                        </Link> */}
                </div>
            </div>
        </>
    );
});

export default AppTopbar;
