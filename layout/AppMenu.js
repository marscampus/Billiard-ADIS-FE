import React, { useContext, useEffect, useState } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { decrypt, decrypter } from '../utilities/encrypt';
// import { RoleContext } from './context/rolecontext';

const AppMenu = () => {
    const router = useRouter();
    const { layoutConfig } = useContext(LayoutContext);
    const { data: session, status } = useSession();
    const [models, setModels] = useState([]);

    let model = [];
    model = session?.user?.menu;
    // let arr = [];
    // if (status == 'authenticated') {
    // } else if (status == 'unauthenticated') {
    //   // router.push('/login');
    // }


    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model?.map((item, i) => {
                    return !item.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}
            </ul>
        </MenuProvider>
    );

    // const { layoutConfig } = useContext(LayoutContext);
    // const contextPath = getConfig().publicRuntimeConfig.contextPath;
    // const model = [
    //     {
    //         label: 'Home',
    //         items: [
    //             /** Menu */
    //             {
    //                 label: 'Dashboard',
    //                 icon: 'pi pi-fw pi-home',
    //                 to: '/'
    //             }
    //         ]
    //     },
    //     {
    //         label: 'master',
    //         items: [
    //             {
    //                 label: 'Akuntansi',
    //                 icon: 'pi pi-fw pi-dollar',
    //                 items: [
    //                     {
    //                         label: 'Bank & E-Commerce',
    //                         icon: 'pi pi-fw pi-building',
    //                         to: '/master/akuntansi/bank'
    //                     },
    //                     {
    //                         label: 'COA (Chart of Account)',
    //                         icon: 'pi pi-fw pi-credit-card',
    //                         to: '/master/akuntansi/coa'
    //                         // items: [
    //                         //     {
    //                         //         label: 'Aset',
    //                         //         to: '/master/akuntansi/coa'
    //                         //     },
    //                         //     {
    //                         //         label: 'Kewajiban',
    //                         //         to: ''
    //                         //     },
    //                         //     {
    //                         //         label: 'Modal',
    //                         //         to: ''
    //                         //     },
    //                         //     {
    //                         //         label: 'Pendapatan',
    //                         //         to: ''
    //                         //     },
    //                         //     {
    //                         //         label: 'Biaya',
    //                         //         to: ''
    //                         //     },
    //                         //     {
    //                         //         label: 'Administrasi',
    //                         //         to: ''
    //                         //     }
    //                         // ]
    //                     },
    //                     {
    //                         label: 'Uang Pecahan',
    //                         icon: 'pi pi-fw pi-money-bill',
    //                         to: '/master/akuntansi/uang_pecahan'
    //                     }
    //                 ]
    //             },
    //             {
    //                 label: 'Inventori',
    //                 icon: 'pi pi-fw pi-table',
    //                 items: [
    //                     {
    //                         label: 'Produk',
    //                         icon: 'pi pi-fw pi-briefcase',
    //                         to: '/master/inventori/produk'
    //                     },
    //                     {
    //                         label: 'Barcode',
    //                         icon: 'pi pi-fw pi-qrcode',
    //                         to: '/master/inventori/barcode'
    //                     },
    //                     {
    //                         label: 'Perubahan Harga',
    //                         icon: 'pi pi-fw pi-tag',
    //                         to: '/master/inventori/perubahan_harga'
    //                     }
    //                 ]
    //             },
    //             {
    //                 label: 'Stock',
    //                 icon: 'pi pi-fw pi-box',
    //                 items: [
    //                     {
    //                         label: 'Golongan Stock',
    //                         icon: 'pi pi-fw pi-folder',
    //                         to: '/master/stok/golongan_stok'
    //                     },
    //                     {
    //                         label: 'Satuan Stock',
    //                         icon: 'pi pi-fw pi-paperclip',
    //                         to: '/master/stok/satuan_stok'
    //                     },
    //                     {
    //                         label: 'Gudang',
    //                         icon: 'pi pi-fw pi-th-large',
    //                         to: '/master/stok/gudang'
    //                     },
    //                     {
    //                         label: 'Rak',
    //                         icon: 'pi pi-fw pi-chart-bar',
    //                         to: '/master/stok/rak'
    //                     }
    //                 ]
    //             },
    //             {
    //                 label: 'Supplier',
    //                 icon: 'pi pi-fw pi-shopping-cart  ',
    //                 items: [
    //                     {
    //                         label: 'Jenis Supplier',
    //                         icon: 'pi pi-fw pi-paperclip',
    //                         to: '/master/supplier/jenis_supplier'
    //                     },
    //                     {
    //                         label: 'Daftar Supplier',
    //                         icon: 'pi pi-fw pi-list',
    //                         to: '/master/supplier/daftar_supplier'
    //                     }
    //                 ]
    //             },
    //             {
    //                 label: 'Customer',
    //                 icon: 'pi pi-fw pi-users  ',
    //                 items: [
    //                     {
    //                         label: 'Jenis Customer',
    //                         icon: 'pi pi-fw pi-user',
    //                         to: '/master/customer/jenis_customer'
    //                     },
    //                     {
    //                         label: 'Daftar Customer',
    //                         icon: 'pi pi-fw pi-user-plus',
    //                         to: '/master/customer/daftar_customer'
    //                     },
    //                     // {
    //                     //     label: 'Posting Saldo Customer',
    //                     //     icon: 'pi pi-fw pi-send',
    //                     //     to: '/master/customer/posting_saldo'
    //                     // },
    //                     {
    //                         label: 'Mutasi Customer',
    //                         icon: 'pi pi-fw pi-align-left',
    //                         to: '/master/customer/mutasi_customer'
    //                     }
    //                 ]
    //             },
    //             {
    //                 label: 'Info Kasir',
    //                 icon: 'pi pi-fw pi-info-circle',
    //                 items: [
    //                     {
    //                         label: 'Banner Menu Kasir',
    //                         icon: 'pi pi-fw pi-image',
    //                         to: '/master/info_kasir/banner'
    //                     },
    //                     {
    //                         label: 'Setup Info Kasir',
    //                         icon: 'pi pi-fw pi-cog',
    //                         to: '/master/info_kasir/setup_info_kasir'
    //                     }
    //                 ]
    //             }
    //         ]
    //     },
    //     {
    //         label: 'Kasir',
    //         items: [
    //             {
    //                 label: 'Penjualan Toko',
    //                 icon: 'pi pi-fw pi-print',
    //                 to: '/kasir'
    //             }
    //         ]
    //     },
    //     {
    //         label: 'Pembelian',
    //         items: [
    //             {
    //                 label: 'Pembelian',
    //                 icon: 'pi pi-fw pi-arrow-down-left',
    //                 items: [
    //                     {
    //                         label: 'Purchase Order',
    //                         icon: 'pi pi-fw pi-external-link',
    //                         to: '/pembelian/purchase-order'
    //                         // to: '/pembelian/po'
    //                     },
    //                     {
    //                         label: 'Pembelian/Penerimaan Barang',
    //                         icon: 'pi pi-fw pi-box',
    //                         to: '/pembelian/penerimaan-barang'
    //                     },
    //                     {
    //                         label: 'Retur Pembelian',
    //                         icon: 'pi pi-fw pi-replay',
    //                         to: '/pembelian/retur'
    //                     },
    //                     {
    //                         label: 'Pembayaran Faktur',
    //                         icon: 'pi pi-fw pi-money-bill',
    //                         to: '/pembelian/pembayaran-faktur'
    //                     },
    //                     // {
    //                     //     label: 'Retur Pembelian (Tanpa Faktur)',
    //                     //     icon: 'pi pi-fw pi-replay',
    //                     //     to: '/pembelian/retur'
    //                     // },
    //                     // {
    //                     //     label: 'Pelunasan Hutang',
    //                     //     icon: 'pi pi-fw pi-money-bill',
    //                     //     to: '/pembelian/pelunasan-hutang'
    //                     // }
    //                 ]
    //             }
    //         ]
    //     },
    //     {
    //         label: 'Penjualan',
    //         items: [
    //             {
    //                 label: 'Penjualan',
    //                 icon: 'pi pi-fw pi-arrow-up-right',
    //                 items: [
    //                     {
    //                         label: 'Penjualan Mitra/Customer',
    //                         icon: 'pi pi-fw pi-user',
    //                         to: '/penjualan/mitra-customer'
    //                     },
    //                     {
    //                         label: 'Retur Penjualan (dengan Faktur)',
    //                         icon: 'pi pi-fw pi-replay',
    //                         to: '/penjualan/retur'
    //                     },
    //                     {
    //                         label: 'Retur Penjualan (Tanpa Faktur)',
    //                         icon: 'pi pi-fw pi-replay',
    //                         to: '/penjualan/retur'
    //                     },
    //                     {
    //                         label: 'Pelunasan Piutang',
    //                         icon: 'pi pi-fw pi-money-bill',
    //                         to: '/penjualan/pelunasan-piutang'
    //                     }
    //                 ]
    //             }
    //         ]
    //     },
    //     {
    //         label: 'Laporan',
    //         items: [
    //             {
    //                 label: 'Laporan Pembelian',
    //                 icon: 'pi pi-fw pi-window-minimize',
    //                 items: [
    //                     {
    //                         label: 'Laporan Purchase Order',
    //                         icon: 'pi pi-fw pi-external-link',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Pembelian Hutang',
    //                         icon: 'pi pi-fw pi-money-bill',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Laporan Pembelian',
    //                         icon: 'pi pi-fw pi-file',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'PPN Masukan',
    //                         icon: 'pi pi-fw pi-percentage',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Rekap Pembelian',
    //                         icon: 'pi pi-fw pi-file',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Retur Pembelian',
    //                         icon: 'pi pi-fw pi-reply',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Laporan Supplier',
    //                         icon: 'pi pi-fw pi-shopping-cart',
    //                         items: [
    //                             {
    //                                 label: 'Daftar Supplier',
    //                                 to: ''
    //                             },
    //                             {
    //                                 label: 'Kartu Hutang',
    //                                 to: ''
    //                             },
    //                             {
    //                                 label: 'Pelunasan Hutang',
    //                                 to: ''
    //                             },
    //                             {
    //                                 label: 'Saldo Hutang',
    //                                 to: ''
    //                             }
    //                         ]
    //                     }
    //                 ]
    //             },
    //             {
    //                 label: 'Laporan Penjualan',
    //                 icon: 'pi pi-fw pi-window-maximize',
    //                 to: '',
    //                 items: [
    //                     {
    //                         label: 'Penjualan Customer',
    //                         icon: 'pi pi-fw pi-file',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Piutang Customer',
    //                         icon: 'pi pi-fw pi-wallet',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Pelunasan Piutang',
    //                         icon: 'pi pi-fw pi-money-bill',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Rekap Penjualan',
    //                         icon: 'pi pi-fw pi-file',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Retur Penjualan',
    //                         icon: 'pi pi-fw pi-undo',
    //                         to: ''
    //                     }
    //                 ]
    //             },
    //             {
    //                 label: 'Laporan Kasir',
    //                 icon: 'pi pi-fw pi-print',
    //                 to: ''
    //             },
    //             {
    //                 label: 'Laporan Customer',
    //                 icon: 'pi pi-fw pi-user',
    //                 to: '',
    //                 items: [
    //                     {
    //                         label: 'Kartu Piutang',
    //                         icon: 'pi pi-fw pi-mobile',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Pembayaran Piutang',
    //                         icon: 'pi pi-fw pi-money-bill',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Saldo Piutang',
    //                         icon: 'pi pi-fw pi-dollar',
    //                         to: ''
    //                     }
    //                 ]
    //             },
    //             {
    //                 label: 'Laporan Lain',
    //                 icon: 'pi pi-fw pi-ticket',
    //                 to: '',
    //                 items: [
    //                     {
    //                         label: 'Penjualan Point Belanja',
    //                         icon: 'pi pi-fw pi-user',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'PPN Keluaran',
    //                         icon: 'pi pi-fw pi-user',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Laba Kotor Penjualan',
    //                         icon: 'pi pi-fw pi-user',
    //                         to: ''
    //                     }
    //                 ]
    //             }
    //         ]
    //     },
    //     {
    //         label: 'Stock',
    //         items: [
    //             {
    //                 label: 'Transaksi',
    //                 icon: 'pi pi-fw pi-shopping-bag',
    //                 items: [
    //                     {
    //                         label: 'Kirim Stock ke Gudang Lain',
    //                         icon: 'pi pi-fw pi-car',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Packing Stock',
    //                         icon: 'pi pi-fw pi-box',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Penyesuaian Stock',
    //                         icon: 'pi pi-fw pi-clone',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Terima Stock dari Gudang Lain',
    //                         icon: 'pi pi-fw pi-car',
    //                         to: ''
    //                     }
    //                 ]
    //             },
    //             {
    //                 label: 'Menu Stock 1',
    //                 icon: 'pi pi-fw pi-th-large',
    //                 items: [
    //                     {
    //                         label: 'Daftar Stock',
    //                         icon: 'pi pi-fw pi-list',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Isi Satuan Stock',
    //                         icon: 'pi pi-fw pi-folder-open',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Saldo Stock',
    //                         icon: 'pi pi-fw pi-dollar',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Saldo Tidak Stock',
    //                         icon: 'pi pi-fw pi-circle-off',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Saldo Stock per Rak',
    //                         icon: 'pi pi-fw pi-filter',
    //                         to: ''
    //                     }
    //                 ]
    //             },
    //             {
    //                 label: 'Menu Stock 2',
    //                 icon: 'pi pi-fw pi-th-large',
    //                 items: [
    //                     {
    //                         label: 'Nilai Persediaan',
    //                         icon: 'pi pi-fw pi-chart-pie',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Rekap Nilai Persediaan',
    //                         icon: 'pi pi-fw pi-sliders-h',
    //                         to: ''
    //                     }
    //                 ]
    //             },
    //             {
    //                 label: 'Menu Stock 3',
    //                 icon: 'pi pi-fw pi-th-large',
    //                 items: [
    //                     {
    //                         label: 'Mutasi Stock Antar Gudang',
    //                         icon: 'pi pi-fw pi-sitemap',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Laporan Penyesuaian Stock',
    //                         icon: 'pi pi-fw pi-inbox',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Laporan Packing Stock',
    //                         icon: 'pi pi-fw pi-box',
    //                         to: ''
    //                     }
    //                 ]
    //             },
    //             {
    //                 label: 'Menu Stock 4',
    //                 icon: 'pi pi-fw pi-th-large',
    //                 items: [
    //                     {
    //                         label: 'Daftar Stock Kosong',
    //                         icon: 'pi pi-fw pi-ellipsis-h',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Daftar Kartu Stock',
    //                         icon: 'pi pi-fw pi-bars',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'Daftar Stock Minus',
    //                         icon: 'pi pi-fw pi-minus-circle',
    //                         to: ''
    //                     },
    //                     {
    //                         label: 'HPP Stock',
    //                         icon: 'pi pi-fw pi-tags',
    //                         to: ''
    //                     }
    //                 ]
    //             }
    //         ]
    //     }
    // ];

    // return (
    //     <MenuProvider>
    //         <ul className="layout-menu">
    //             {model.map((item, i) => {
    //                 return !item.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
    //             })}

    //             {/* <Link href="https://www.primefaces.org/primeblocks-react" target="_blank" style={{ cursor: 'pointer' }}>
    //                 <img alt="Prime Blocks" className="w-full mt-3" src={`${contextPath}/layout/images/banner-primeblocks${layoutConfig.colorScheme === 'light' ? '' : '-dark'}.png`} />
    //             </Link> */}
    //         </ul>
    //     </MenuProvider>
    // );
};

export default AppMenu;
