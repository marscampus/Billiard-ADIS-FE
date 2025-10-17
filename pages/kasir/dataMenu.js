/**
 * Nama Program: GODONG POS - Data Barang Grid
 * Pengembang: Salsabila Emma
 * Tanggal Pengembangan: 1 Feb 2024
 * Versi: 1.0.0

    Catatan:
    - Versi 1.0.0 mencakup fungsionalitas Data Barang Tabel
 */
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { DataView } from 'primereact/dataview';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Tooltip } from 'primereact/tooltip';
import { Tag } from 'primereact/tag';
import React, { useEffect, useRef, useState } from 'react';
import { formatRibuan, showError } from '../../component/GeneralFunction/GeneralFunction';
import Payment from './payment';

// ------------------------------< Cart Item >

const cartItemStyles = {
    container: {
        // display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid #ccc',
        padding: '10px',
        boxSizing: 'border-box',
        minWidth: '280px',
        display: 'flex'
    },
    info: {
        // flex: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    NAMA: {
        // fontSize: '16px',
        fontWeight: 'bold'
    },
    HJ: {
        // fontSize: '14px',
        color: '#777'
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        margin: '5px 0'
    },
    quantity: {
        margin: '0 10px'
        // fontSize: '14px',
    }
};

const ButtonQtyStle = {
    display: 'inline-block',
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
    outline: 'none',
    // borderRadius: '5px 0px 0px 5px',
    // backgroundColor: '#689f38',
    transition: 'background-color 0.3s, color 0.3s',

    minus: {
        borderRadius: '5px 0px 0px 5px',
        backgroundColor: '#fbc02d',
        color: '#fff',
        border: 'none',
        padding: '4px 9px',
        fontSize: '16px'
    },

    plus: {
        borderRadius: '0px 5px 5px 0px',
        backgroundColor: '#689f38',
        color: '#fff',
        border: 'none',
        padding: '4px 9px',
        fontSize: '16px'
    },

    delete: {
        borderRadius: '5px 5px 5px 5px',
        backgroundColor: '#EF4444',
        color: '#fff',
        border: 'none',
        padding: '4px 9px',
        fontSize: '16px'
    }
};

export function searchGrid() {
    const apiEndPointGetListProduk = '/api/produk/get-filter';
    const [loading, setLoading] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const onPage = (event) => {
        setlazyState(event);
    };

    // ----------------------------------------------------------------------------------------< Pencarian >
    const [inputValue, setInputValue] = useState('');
    const [timer, setTimer] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);

    const dropdownValues = [
        { name: 'KODE_TOKO', label: 'BARCODE' },
        { name: 'NAMA', label: 'NAMA' }
    ];
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };

            _lazyState['filters'] = { ...lazyState.filters }; // Copy existing filters
            // if (selectedSesi) {
            //     // Add selectedSesi to filters if available
            //     _lazyState.filters["selectedSesi"] = selectedSesi;
            // }
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };

    return (
        <div className="grid formgrid">
            <div className="field col-12 mb-2 lg:col-4">
                <div className="p-inputgroup">
                    <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" />
                </div>
            </div>
            <div className="field col-12 mb-2 lg:col-8">
                <div className="p-inputgroup">
                    <InputText type="search" onChange={(e) => inputChanged(e.target.value)} placeholder="Search..." />
                </div>
            </div>
        </div>
    );
}

import postData from '../../lib/Axios';
import { getSessionServerSide } from '../../utilities/servertool';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/kasir');
    if (sessionData?.redirect) {
        return sessionData;
    }
    // const { id } = context.params;
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};

function DataMenu({ addItem, setAddItem, calculateUpdatedGrandTotalDisc, dataShift, selectedSesi, onRowSelectBarcode, isChecked }) {
    const apiEndPointGetListProduk = '/api/produk/get-filter';
    const toast = useRef(null);
    const [noteDialog, setNoteDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentNote, setCurrentNote] = useState('');
    const [nameNotes, setNameNotes] = useState();
    const [search, setSearch] = useState('');
    const [reloadDataMenu, setReloadDataMenu] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const styles = {
        itemGrid: {
            display: 'flex',
            gridTemplateColumns: 'repeat(auto-fit, minmax(50px, 1fr))',
            gap: '5px',
            padding: '5px',
            justifyContent: 'center'
        },
        itemCard: {
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            padding: '5px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'center'
        },
        itemImage: {
            width: '100px',
            height: '100px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '8px'
        },
        itemDefault: {
            width: '100px',
            height: '100px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '8px'
        },
        badgeContainer: {
            display: 'flex',
            gap: '4px',
            justifyContent: 'center',
            marginBottom: '8px'
        },
        itemName: {
            fontWeight: 'bold',
            fontSize: '1rem',
            marginBottom: '8px'
        },
        itemFooter: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
        },
        itemPrice: {
            textAlign: 'right',
            color: '#689f38'
        },
        priceOriginal: {
            textDecoration: 'line-through',
            color: '#999'
        },
        priceDiscounted: {
            fontWeight: 'bold',
            color: '#689f38'
        }
    };

    const ContentDashboard1Style = {
        display: 'flex',
        flexDirection: 'row',
        // justifyContent: 'space-between',
        // alignItems: 'flex-start',
        flexWrap: 'wrap'
    };

    const flexItemStyle = {
        // flex: '0 0 75%', // Flex-grow dan flex-shrink diset ke 0, dan basis lebar 75%
        backgroundColor: '#fff',
        color: 'black',
        textAlign: 'left',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        padding: '5px',
        margin: '5px',
        boxShadow: '0 0 3.5px rgba(0, 64, 17, 0.5)',
        minWidth: '75%', // Menjamin lebar minimum tetap 75%
        boxSizing: 'border-box', // Menghindari margin/padding merusak layout
        justifyContent: 'space-between'
    };

    // Functional fitur dropdown -----------------------------------------------------------
    const [currentPage, setCurrentPage] = useState(0);
    const handleScroll = () => {
        const container = document.querySelector('.divScroll');
        if (container) {
            const { scrollTop, clientHeight, scrollHeight } = container;
            if (scrollHeight - scrollTop === clientHeight) {
                setCurrentPage((prevPage) => prevPage + 1);
            }
        }
    };

    useEffect(() => {
        toggleBarcode();
        const container = document.querySelector('.divScroll');
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [currentPage]);

    useEffect(() => {
        toggleBarcode();
    }, [reloadDataMenu]);

    const [loadingDropdown, setLoadingDropdown] = useState(false);
    // -----------------------------------------------------------------------------------------------------------------------------< List Produk >

    const [barcodeTabel, setBarcodeTabel] = useState([]);
    const [barcodeTabelFilt, setBarcodeTabelFilt] = useState([]);
    const [loadingItem, setLoadingItem] = useState(false);

    useEffect(() => {
        setBarcodeTabelFilt(barcodeTabel);
    }, [barcodeTabel, lazyState]);

    const toggleBarcode = async (event, showDialog = true) => {
        if (!loadingDropdown) {
            setLoadingItem(true);
        } else {
            setLoadingDropdown(true);
        }

        try {
            const vaTable = await postData(apiEndPointGetListProduk, lazyState);
            const newData = vaTable.data.data ?? [];

            setBarcodeTabel((prevData) => {
                // Menggabungkan data lama dengan data baru
                const existingCodes = new Set(prevData.map((item) => item.KODE)); // Mengambil kode yang sudah ada
                const filteredNewData = newData?.filter((item) => !existingCodes.has(item.KODE)); // Menyaring data baru

                return [...prevData, ...filteredNewData]; // Menggabungkan data lama dengan data baru yang telah disaring
            });

            // Periksa apakah semua data telah dimuat
            if (newData.length === 0) {
                window.removeEventListener('scroll', handleScroll); // Hapus listener jika semua data telah dimuat
            }
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            if (!loadingDropdown) {
                setLoadingItem(false);
            } else {
                setLoadingDropdown(false);
            }
        }
    };

    const addToCart = async (item) => {
        const selectedKode = item.KODE_TOKO || item.BARCODE;
        const enteredQty = item.QTY || 1;

        if (!selectedKode) {
            return;
        }

        try {
            setNameNotes(item.NAMA);
            const vaTable = { data: [item] };
            const json = vaTable.data;
            if (json[0].SISASTOCKBARANG === 'Habis') {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error Message',
                    detail: 'Stock Barang Sudah Habis',
                    life: 3000
                });
                return;
            }

            if (json.status === 'BARANG TIDAK DITEMUKAN') {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error Message',
                    detail: 'Barang Tidak Ditemukan',
                    life: 3000
                });
                return;
            }

            const valBarcode = json[0].KODE_TOKO;
            const existingIndex = addItem.findIndex((item) => item.KODE_TOKO === valBarcode);
            const qtyToAdd = json[0].QTY || enteredQty;

            if (json[0].DISKONPERIODE === 'ADA') {
                json[0].DISCOUNT = 0;
            }

            const handleExistingItem = (existingItem, qtyToAdd) => {
                const ketAsal = 'existInTable';
                if (json[0].SISASTOCKBARANG - existingItem.QTY === 0) {
                    toast.current.show({
                        severity: 'error',
                        summary: 'Error Message',
                        detail: 'Barang yang ditambahkan melebihi stock yang tersedia',
                        life: 3000
                    });
                    return null;
                }

                const funcCalculate = calculateUpdatedGrandTotalDisc(existingItem, qtyToAdd, undefined, undefined, ketAsal);

                return {
                    ...existingItem,
                    QTY: funcCalculate.updatedQTY,
                    SUBTOTAL: funcCalculate.subTotal,
                    GRANDTOTAL: funcCalculate.updatedGrandTotalDisc,
                    HARGADISCQTY: funcCalculate.hargaDisc * funcCalculate.updatedQTY,
                    HARGAPPN: funcCalculate.hargaPPN
                };
            };

            const handleNewItem = (newItem, qtyToAdd) => {
                const ketAsal = 'firstEnter';
                const funcCalculate = calculateUpdatedGrandTotalDisc(newItem, qtyToAdd, undefined, undefined, ketAsal);

                return {
                    ...newItem,
                    QTY: funcCalculate.updatedQTY,
                    SUBTOTAL: funcCalculate.subTotal,
                    GRANDTOTAL: funcCalculate.updatedGrandTotalDisc,
                    HARGADISCQTY: funcCalculate.hargaDisc * qtyToAdd,
                    HARGAPPN: funcCalculate.hargaPPN
                };
            };

            if (existingIndex !== -1) {
                setAddItem((prevAddItem) => {
                    const updatedAddItem = [...prevAddItem];
                    const existingItem = updatedAddItem[existingIndex];
                    const updatedItem = handleExistingItem(existingItem, qtyToAdd);

                    if (!updatedItem) return updatedAddItem; // Stock habis

                    updatedAddItem[existingIndex] = updatedItem;
                    return updatedAddItem;
                });
            } else {
                const newItem = handleNewItem(json[0], qtyToAdd);
                setAddItem((prevAddItem) => [...prevAddItem, newItem]);
            }

            // Scroll ke elemen baris baru jika ada
            const newDataRow = document.getElementById('new-data-row');
            if (newDataRow) {
                newDataRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Terjadi Kesalahan',
                life: 3000
            });
        }
    };

    const handleDiscountChange = (eSelectItem, newDiscount) => {
        // Validasi nilai diskon yang diinput
        const discValue = newDiscount === '' || newDiscount === null || newDiscount < 0 ? 0 : newDiscount;

        // Temukan item berdasarkan BARCODE
        const existingIndex = addItem.findIndex((item) => item.KODE === eSelectItem.KODE);

        if (existingIndex !== -1) {
            // Pastikan hanya item yang dimodifikasi diperbarui
            setAddItem((prevAddItem) => {
                return prevAddItem.map((item, index) => {
                    if (index === existingIndex) {
                        // Hanya update item yang sesuai
                        const ketAsal = 'inputDiscFromGrid'; // Keterangan asal perubahan
                        const funcCalculate = calculateUpdatedGrandTotalDisc(item, null, null, discValue, ketAsal);

                        // Kembalikan data yang diperbarui
                        return {
                            ...item,
                            DISCOUNT: discValue,
                            GRANDTOTAL: funcCalculate.updatedGrandTotalDisc
                        };
                    }
                    // Tidak ada perubahan untuk item lainnya
                    return item;
                });
            });
        } else {
            console.warn('Item not found in addItem list.');
        }
    };

    const handleQuantityChange = (eSelectItem, newQuantity) => {
        const sisaStock = parseInt(eSelectItem.SISASTOCKBARANG, 10);
        let quantityValue = newQuantity.value === '' || newQuantity.value === null || newQuantity.value < 0 ? 0 : parseInt(newQuantity.value, 10);

        // Check if quantity exceeds available stock
        if (quantityValue > sisaStock && sisaStock !== '∞') {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: `Qty tidak boleh lebih dari Sisa Stock (${parseInt(sisaStock)})`,
                life: 3000
            });
            quantityValue = sisaStock; // Reset quantity to available stock
        }

        // If quantity is 0, remove item from cart
        if (quantityValue === 0) {
            removeFromCart(eSelectItem.KODE);
            return;
        }

        const existingIndex = addItem.findIndex((item) => item.KODE === eSelectItem.KODE);
        setAddItem((prevAddItem) => {
            const ketAsal = 'inputQtyFromGrid';
            const updatedAddItem = [...prevAddItem];
            const addedData = updatedAddItem[existingIndex];
            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, null, quantityValue, null, ketAsal);

            updatedAddItem[existingIndex] = {
                ...addedData,
                QTY: quantityValue,
                GRANDTOTAL: funcCalculate.updatedGrandTotalDisc
            };
            return updatedAddItem;
        });
    };

    const removeFromCart = (itemBarcode) => {
        const updatedCartData = addItem.filter((item) => item.KODE_TOKO !== itemBarcode);
        setAddItem(updatedCartData);
    };
    // Fungsi untuk menghitung harga diskon
    const calculateDiscountedPrice = (originalPrice, discount) => {
        const discountedPrice = originalPrice - (originalPrice * discount) / 100;
        return discountedPrice;
    };

    const [paymentDialog, setPaymentDialog] = useState(false);
    const [ppn, setPpn] = useState(0);
    const [isDisabled, setIsDisabled] = useState(false);
    const btnPayment = () => {
        if (addItem && addItem.length > 0) {
            // Periksa apakah ada item dengan BKP bernilai "1"
            const hasBKP1 = addItem.some((item) => item.BKP === '1');

            // Set state disabled berdasarkan hasil pemeriksaan
            setPaymentDialog(true);
            setIsDisabled(hasBKP1);
        } else {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Daftar Belanja Masih Kosong!', life: 3000 });
        }
    };
    const totQty = addItem.reduce((accumulator, item) => accumulator + parseFloat(item.QTY), 0);
    const totSubTotal = addItem.reduce((accumulator, item) => accumulator + parseFloat(item.SUBTOTAL), 0);
    const totDiscount = addItem.reduce((accumulator, item) => accumulator + parseFloat(item.HARGADISCQTY), 0);
    const totGrandTotal = addItem.reduce((accumulator, item) => accumulator + parseFloat(item.GRANDTOTAL), 0);

    //  Yang Handle Pencairan
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup"></div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = barcodeTabel.filter((d) => (x ? x.test(d.KODE_TOKO) || x.test(d.NAMA) || x.test(d.HJ) : []));
            setSearch(searchVal);
        }

        setBarcodeTabelFilt(filtered);
    };

    //  Yang Handle Catatan
    const openNoteDialog = (item) => {
        setSelectedItem(item);
        setCurrentNote(item.NOTES || '');
        setNoteDialog(true);
    };

    const saveNote = () => {
        if (selectedItem) {
            // Perbarui catatan di addItem
            const updatedItems = addItem.map((item) => (item.KODE_TOKO === selectedItem.KODE_TOKO ? { ...item, NOTES: currentNote } : item));
            setAddItem(updatedItems);
        }
        setNoteDialog(false);
    };

    const itemTemplate = (item) => {
        const getItemImage = () => {
            if (item.FOTO) {
                return `data:image/jpeg;base64,${item.FOTO}`;
            }
            return '/dummy-pict.png';
        };

        return (
            <div className="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
                <div className="p-4 border-1 surface-border surface-card border-round-xl flex flex-column gap-3 shadow-2 h-full">
                    {/* Image Section */}
                    <div className="relative">
                        <img
                            alt={item.NAMA}
                            src={getItemImage()}
                            className="w-full border-round-md"
                            style={{
                                height: '200px',
                                objectFit: 'cover',
                                objectPosition: 'center',
                                minHeight: '200px'
                            }}
                        />
                        <div className="flex justify-content-between absolute top-0 left-0 p-2 gap-2 w-full">
                            <Tag value={item.KODE_TOKO} severity="success" className="text-sm" />
                            <Tag value={`-${item.DISCOUNT}%`} severity="warning" className="text-sm" />
                        </div>
                    </div>

                    {/* Product Name */}
                    <div className="font-bold text-lg truncate" title={item.NAMA}>
                        {item.NAMA}
                    </div>

                    {/* Price Section */}
                    <div className="flex flex-column gap-2">
                        <div className="flex justify-content-between align-items-center gap-2">
                            <Button icon="pi pi-plus" className="p-button-success p-button-sm flex-grow-1" onClick={() => addToCart(item)} />
                            <div className="flex flex-column text-right">
                                {item.DISCOUNT > 0 ? (
                                    <>
                                        <span className="text-color-secondary line-through text-sm">Rp{formatRibuan(item.HJ)}</span>
                                        <span className="text-green-600 font-bold">Rp{formatRibuan(calculateDiscountedPrice(item.HJ, item.DISCOUNT))}</span>
                                    </>
                                ) : (
                                    <span className="text-green-600 font-bold">Rp{formatRibuan(item.HJ)}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div>
                <div className="grid">
                    <Toast ref={toast} />
                    <div className="field col-7 mb-2 lg:col-8 md:col-8">
                        <div className="card">
                            <DataView paginator rows={12} value={barcodeTabelFilt} itemTemplate={itemTemplate} layout={'grid'} loading={loadingItem} header={headerSearch} />
                        </div>
                    </div>
                    {/* ----------------------------------------------------------------------------------------------------------------------< Keranjang > */}
                    <div className="field col-5 mb-2 lg:col-4 md:col-4">
                        <div className="card">
                            <div className="p-field flex-row" style={{ overflowY: 'auto', maxHeight: '310px' }}>
                                {addItem.length === 0 ? (
                                    <div style={{ textAlign: 'center', width: '100%' }}>
                                        <h5>Daftar Barang Kosong</h5>
                                        <hr />
                                    </div>
                                ) : (
                                    addItem.map((item) => (
                                        <div style={cartItemStyles.container} key={item.BARCODE}>
                                            <div className="grid formgrid">
                                                {/* Informasi Barang */}
                                                <div className="field col-12 mb-2 lg:col-6">
                                                    <div style={cartItemStyles.NAMA}>{item.NAMA.length > 15 ? `${item.NAMA.substring(0, 20)}...` : item.NAMA}</div>
                                                    <div style={cartItemStyles.sisaStock}>Sisa Stock: {item.SISASTOCKBARANG === 'Unlimited' ? '∞' : parseInt(item.SISASTOCKBARANG)}</div>
                                                </div>

                                                {/* Harga Barang */}
                                                <div className="field col-12 mb-2 lg:col-6" style={{ textAlign: 'right' }}>
                                                    <div style={cartItemStyles.HJ}>
                                                        {item.DISKONPERIODE === 'ADA' && <span style={{ border: '1px solid green', color: 'green', padding: '2px 4px', marginRight: '8px' }}>Promo</span>}
                                                        {`Rp. ${formatRibuan(item.GRANDTOTAL)}`}
                                                    </div>
                                                </div>

                                                {/* Aksi (Qty, Diskon, Hapus) */}
                                                <div style={cartItemStyles.actions}>
                                                    {/* Tombol Kurangi Jumlah */}
                                                    <Button
                                                        icon="pi pi-minus"
                                                        className="p-button-warning p-button-sm"
                                                        style={ButtonQtyStle.minus}
                                                        onClick={() => {
                                                            const newQuantity = item.QTY - 1;
                                                            handleQuantityChange(item, { value: newQuantity });
                                                        }}
                                                    />

                                                    {/* Input Jumlah Barang */}
                                                    <span style={cartItemStyles.quantity}>
                                                        <InputNumber value={item.QTY} onChange={(value) => handleQuantityChange(item, value)} className="p-inputgroup" inputStyle={{ width: '50px', textAlign: 'center' }} />
                                                    </span>

                                                    {/* Tombol Tambah Jumlah */}
                                                    <Button
                                                        icon="pi pi-plus"
                                                        className="p-button-success p-button-sm"
                                                        style={ButtonQtyStle.plus}
                                                        // onClick={() => {
                                                        //     updateFromCart(item);
                                                        // }}
                                                        onClick={() => {
                                                            const newQuantity = item.QTY + 1;
                                                            handleQuantityChange(item, { value: newQuantity });
                                                        }}
                                                    />

                                                    {/* Tombol Hapus Barang */}
                                                    <Button icon="pi pi-trash" className="p-button-danger p-button-sm ml-2" style={ButtonQtyStle.delete} onClick={() => removeFromCart(item.KODE_TOKO)} />

                                                    {/* Input Diskon */}
                                                    <span style={cartItemStyles.quantity}>
                                                        <Tooltip target=".discount-tooltip" position="top" content="Tooltip Content Here" />
                                                        <div className="p-inputgroup" style={{ alignItems: 'center' }}>
                                                            <InputNumber
                                                                placeholder="%Disc"
                                                                value={item.DISCOUNT}
                                                                onChange={(e) => handleDiscountChange(item, e.value)}
                                                                className="p-inputgroup"
                                                                inputStyle={{ width: '50px', textAlign: 'center' }}
                                                                title="Disc%"
                                                            />
                                                            <Button icon="pi pi-percentage" className="p-button-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                                                        </div>
                                                    </span>

                                                    {/* Tombol Untuk Detail Barang (Digunakan untuk keperluan Cetak Struk Dapur) */}
                                                    {/* <Button icon="pi pi-pencil" className="p-button-info" onClick={() => openNoteDialog(item)} /> */}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Bagian Catatan */}
                        <Dialog visible={noteDialog} header={`Detail Pesanan - ${nameNotes}`} modal className="p-fluid" onHide={saveNote}>
                            <div className="formgrid grid">
                                <span style={{ marginBottom: '5px' }}>* Gunakan titik koma ( ; ) untuk mempermudah TEAM DAPUR!^^</span>
                                <InputTextarea autoFocus rows={5} cols={40} value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} />
                                <span style={{ marginBottom: '5px' }}>* Otomatis tersimpan apabila ditutup!^^</span>
                            </div>
                        </Dialog>

                        {/* Bagian Total Bayar */}
                        <div className="card">
                            <div>
                                <div className="mt-1 mr-4" style={{ fontWeight: 'bold', fontSize: '12pt' }}>
                                    Total Bayar:
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <InputText className="w-full mt-2" readOnly value={`Rp. ${formatRibuan(totGrandTotal)}`} style={{ fontSize: '16px', textAlign: 'right', backgroundColor: '#f5f5f5', fontWeight: 'bold' }} />
                                    <Button label="Bayar" className="p-button-primary p-button-lg w-full mb-3 mt-3" onClick={btnPayment} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Payment
                isDisabled={isDisabled}
                setIsDisabled={setIsDisabled}
                selectedSesi={selectedSesi}
                dataShift={dataShift}
                addItem={addItem}
                setReloadDataMenu={setReloadDataMenu}
                setAddItem={setAddItem}
                paymentDialog={paymentDialog}
                setPaymentDialog={setPaymentDialog}
                totGrandTotal={totGrandTotal}
                totQty={totQty}
                totSubTotal={totSubTotal}
                totDiscount={totDiscount}
                ppn={ppn}
                isChecked={isChecked}
            />
            {/* {searchGrid({ setDropdownValue, inputChanged, defaultOption })} */}
        </div>
    );
}

export default DataMenu;
