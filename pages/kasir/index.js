/**
 * Nama Program: GODONG POS - Kasir
 * Pengembang: Salsabila Emma
 * Tanggal Pengembangan: 1 Jan 2024
 * Versi: 1.0.0

    Catatan:
    - Versi 1.0.0 mencakup fungsionalitas Kasir, dan beberapa komponen tunda
    - Read
 */
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { formatDate, formatRibuan, showError } from '../../component/GeneralFunction/GeneralFunction';
import TabelSkaleton from '../../component/tabel/skaleton';
import Member from '../component/member';
import DataBarangTabel from './dataBarangTabel';
import DataMenu, { searchGrid } from './dataMenu';
import Reprint from './reprint';
import Retur from './retur';
import SesiJual from './sesiJual';
import Tunda from './tunda';
import { Accordion, AccordionTab } from 'primereact/accordion';

import postData from '../../lib/Axios';
import { getSessionServerSide } from '../../utilities/servertool';
import Produk from '../component/produk';
import { LayoutContext } from '../../layout/context/layoutcontext';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
const dropdownOptions = [
    { label: 'Mode Tabel', value: 'modeTabel' },
    { label: 'Mode dengan Gambar', value: 'modeGambar' }
];
export default function App() {
    const apiEndPointGetDataFaktur = '/api/kasir_tmp/get_faktur';
    const apiEndPointGetListProduk = '/api/produk/get-filter';
    const toast = useRef(null);
    const { onMenuToggle } = useContext(LayoutContext);
    const [loading, setLoading] = useState(false);
    const [dataList, setDataList] = useState([]);
    const [shiftDialog, setShiftDialog] = useState(true);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columnsBarcode = [{ field: 'Loading ...', header: 'Loading ...' }];

    const [selectedSesi, setSelectedSesi] = useState(null);
    const selectedSesiRef = useRef(null);
    const handleSesiSelect = async (sesi) => {
        setSelectedSesi(sesi);
        selectedSesiRef.current = sesi; // Menyimpan selectedSesi ke useRef
        let requestBody = {
            USERNAME_SUPERVISOR: sesi?.SUPERVISOR,
            USERNAME_KASIR: sesi?.KASIR
        };
        // return
        try {
            const vaTable = await postData(apiEndPointGetFullName, requestBody);
            const json = vaTable.data.data;
            // return;
            setFullName(json);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const apiEndPointGetAllConfig = '/api/config/get';
    const apiEndPointGetFullName = '/api/shift_kasir/sesi_fullname';

    const [fullName, setFullName] = useState(null);
    const [msPPN, setMsPPN] = useState(0);
    useEffect(() => {
        if (!shiftDialog) {
            fetchConfig();
            handleSesiSelect(selectedSesiRef.current);
        }
    }, [shiftDialog]);

    //  Untuk mendapatkan Config dan List Produk
    const fetchConfig = async () => {
        try {
            const vaTable = await postData(apiEndPointGetAllConfig, { kode: ['rek_ppn_toko'] });
            const json = vaTable.data;
            setMsPPN(json.data.rek_ppn_toko); // Mengubah persentase ke desimal
            const vaData = await postData(apiEndPointGetListProduk, lazyState);
            const json2 = vaData.data;
            setDataList(json2.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const onPage = (event) => {
        setlazyState(event);
    };

    // -------------------------------------------------------------------------------------------< BARCODE >
    const [loadingItem, setLoadingItem] = useState(false);
    const [barcodeTabel, setBarcodeTabel] = useState([]);
    const [barcodeDialog, setBarcodeDialog] = useState(false);
    const [addItem, setAddItem] = useState([]);
    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const [dataProduk, setDataProduk] = useState('');
    const btnProduk = (event, showDialog = true) => {
        if (showDialog) {
            setProdukDialog(true);
        }
        // setProdukDialog(true);
    };

    const handleProdukData = (dataProduk) => {
        onRowSelectBarcode({ data: dataProduk });
    };

    useEffect(() => {
        onMenuToggle();
    }, []);

    const calculateUpdatedGrandTotalDisc1 = (addedData, qtyToAdd, editedQty, editedDisc, ketAsal) => {
        let updatedQTY, disc, hargaJual;

        switch (ketAsal) {
            case 'firstEnter':
                updatedQTY = qtyToAdd;
                break;
            case 'existInTable':
                updatedQTY = addedData.QTY + qtyToAdd;
                break;
            case 'editQTYFromTable':
            case 'inputQtyFromGrid':
                updatedQTY = editedQty;
                break;
            case 'editDiscFromTable':
            case 'inputDiscFromGrid':
                updatedQTY = addedData.QTY;
                disc = editedDisc / 100;
                break;
            case 'dataTunda':
                updatedQTY = addedData.QTY;
                hargaJual = addedData.HARGA;
                break;
            default:
                updatedQTY = addedData.QTY - 1;
                break;
        }
        // return;
        if (!hargaJual) hargaJual = addedData.HJ;
        if (addedData.DISKONPERIODE === 'ADA') {
            disc = 0;
            if (updatedQTY > addedData.SISAKUOTADISKON) {
                updatedQTY = addedData.SISAKUOTADISKON;
                toast.current.show({ severity: 'error', summary: 'Error', detail: `Sisa Kuota Diskon Periode ${addedData.SISAKUOTADISKON} pcs.`, life: 3000 });
            } else {
                updatedQTY = updatedQTY;
            }
        } else if (disc === undefined) {
            disc = addedData.DISCOUNT / 100;
        }

        // total setelah diskon = (harga * qty) - ( (harga * qty * %disc / 100) )
        const subTotal = updatedQTY * hargaJual;
        const hargaDisc = hargaJual * disc;
        const hjAfterDisc = hargaJual - hargaDisc;
        const grandTotal = editedDisc === 0 ? hargaJual : hjAfterDisc;
        // const updatedGrandTotalDisc = updatedQTY * grandTotal;
        const totAfterDisc = subTotal - hargaJual * updatedQTY * disc;
        // const updatedGrandTotalDisc = totAfterDisc +

        let updatedGrandTotalDisc = totAfterDisc;
        let hargaPPN = 0;
        if (addedData.BKP === '1') {
            const hitungPPN = totAfterDisc / ((1 + msPPN) / 100);
            hargaPPN = Math.round(totAfterDisc - hitungPPN);
            updatedGrandTotalDisc = totAfterDisc + hargaPPN;
        }
        const fakturTmp = addedData.FAKTUR;

        return { updatedGrandTotalDisc, hargaDisc, subTotal, disc, updatedQTY, fakturTmp, hargaPPN };
    };

    const calculateUpdatedGrandTotalDisc = (addedData, qtyToAdd, editedQty, editedDisc, ketAsal) => {
        let updatedQTY, disc, hargaJual;

        switch (ketAsal) {
            case 'firstEnter':
                updatedQTY = qtyToAdd;
                break;
            case 'existInTable':
                updatedQTY = addedData.QTY + qtyToAdd;
                break;
            case 'editQTYFromTable':
            case 'inputQtyFromGrid':
                updatedQTY = editedQty;
                break;
            case 'editDiscFromTable':
            case 'inputDiscFromGrid':
                updatedQTY = addedData.QTY;
                disc = editedDisc / 100;
                break;
            case 'dataTunda':
                updatedQTY = addedData.QTY;
                hargaJual = addedData.HARGA;
                break;
            default:
                updatedQTY = addedData.QTY - 1;
                break;
        }
        // return;
        if (!hargaJual) hargaJual = addedData.HJ;
        if (addedData.DISKONPERIODE === 'ADA') {
            disc = 0;
            if (updatedQTY > addedData.SISAKUOTADISKON) {
                updatedQTY = addedData.SISAKUOTADISKON;
                toast.current.show({ severity: 'error', summary: 'Error', detail: `Sisa Kuota Diskon Periode ${addedData.SISAKUOTADISKON} pcs.`, life: 3000 });
            } else {
                updatedQTY = updatedQTY;
            }
        } else if (disc === undefined) {
            disc = addedData.DISCOUNT / 100;
        }

        // total setelah diskon = (harga * qty) - ( (harga * qty * %disc / 100) )
        const subTotal = updatedQTY * hargaJual;
        const hargaDisc = hargaJual * disc;
        const hjAfterDisc = hargaJual - hargaDisc;
        const grandTotal = editedDisc === 0 ? hargaJual : hjAfterDisc;
        // const updatedGrandTotalDisc = updatedQTY * grandTotal;
        const totAfterDisc = subTotal - hargaJual * updatedQTY * disc;
        // const updatedGrandTotalDisc = totAfterDisc +

        let updatedGrandTotalDisc = totAfterDisc;
        let hargaPPN = 0;
        if (addedData.BKP === '1') {
            const hitungPPN = totAfterDisc / ((1 + msPPN) / 100);
            hargaPPN = Math.round(totAfterDisc - hitungPPN);
            updatedGrandTotalDisc = totAfterDisc + hargaPPN;
        }
        const fakturTmp = addedData.FAKTUR;

        return { updatedGrandTotalDisc, hargaDisc, subTotal, disc, updatedQTY, fakturTmp, hargaPPN };
    };

    // --------------------------------------------------------------------------< Search Barcode by inputan (enter) >
    const handleBarcodeKeyDown1 = async (event) => {
        if (event.key === 'Enter') {
            const barcodeInput = document.getElementById('barcode');
            const enteredBarcode = barcodeInput.value;
            if (enteredBarcode.trim() === '') {
                return;
            }
            // Periksa apakah barcode yang dimasukkan mencakup kuantitas
            const barcodeDanQty = enteredBarcode.split('*');
            let enteredQty = 1;
            let enteredBarcodeValue = enteredBarcode;

            if (barcodeDanQty.length === 2) {
                enteredQty = parseFloat(barcodeDanQty[0]);
                enteredBarcodeValue = barcodeDanQty[1];
            }
            const params = { data: { KODE_TOKO: enteredBarcodeValue }, skipSelectBarcode: true, qty: enteredQty };
            await onRowSelectBarcode(params);

            barcodeInput.value = '';
        }
    };

    const handleBarcodeKeyDown = async (event) => {
        if (event.key === 'Enter') {
            const barcodeInput = document.getElementById('barcode');
            const enteredBarcode = barcodeInput.value;

            if (enteredBarcode.trim() === '') {
                return;
            }

            // Periksa apakah barcode yang dimasukkan mencakup kuantitas
            const barcodeDanQty = enteredBarcode.split('*');
            let enteredQty = 1;
            let enteredBarcodeValue = enteredBarcode;

            if (barcodeDanQty.length === 2) {
                enteredQty = parseFloat(barcodeDanQty[0]);
                enteredBarcodeValue = barcodeDanQty[1];
            }

            // Cek apakah dataList sudah berisi data
            if (dataList.length > 0) {
                const selectedProduk = dataList.find((produk) => produk.KODE_TOKO === enteredBarcodeValue);
                if (selectedProduk) {
                    const params = { data: selectedProduk, skipSelectBarcode: true, qty: enteredQty };
                    await onRowSelectBarcode(params);
                } else {
                    console.log('Produk tidak ditemukan di dataList');
                }
            } else {
                console.log('Data belum diambil dari API');
            }

            barcodeInput.value = '';
        }
    };

    const handleBarcodeKeyDownKU = async (event) => {
        if (event.key === 'Enter') {
            const barcodeInput = document.getElementById('barcode');
            const enteredBarcode = barcodeInput.value;
            if (enteredBarcode.trim() === '') {
                return;
            }
            const params = { data: { KODE_TOKO: enteredBarcode }, skipSelectBarcode: true };
            await onRowSelectBarcode(params);

            barcodeInput.value = '';
        }
    };
    // -------------------------------------------------------------------< Search Barcode >
    const onRowSelectBarcode1 = async (event) => {
        const selectedKode = event.data.KODE_TOKO;
        const enteredQty = event.qty || 1;
        if (!selectedKode) {
            setBarcodeDialog(false);
            return;
        }
        // --- API
        try {
            //     let requestBody = {
            //         Barcode: `%${selectedKode}%`
            //     };
            //     // const vaTable = await postData(apiEndPointGetBarcode, {`%${selectedKode}%`});
            //     const vaTable = await postData(apiEndPointGetBarcode, requestBody);
            //     const json = vaTable.data;
            if (json.status === 'STOCK BARANG SUDAH HABIS') {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Stock Barang Sudah Habis', life: 3000 });
                setBarcodeDialog(false);
                return;
            }

            if (json.status === 'BARANG TIDAK DITEMUKAN') {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Barang Tidak Ditemukan', life: 3000 });
                setBarcodeDialog(false);
                return;
            }

            const valBarcode = json[0].BARCODE;
            const existingIndex = addItem.findIndex((item) => item.BARCODE === valBarcode);
            // const qtyToAdd = json.QTY || 1;
            const qtyToAdd = json.QTY || enteredQty || 1;

            if (json[0].DISKONPERIODE === 'ADA') {
                json[0].DISCOUNT = 0;
            }

            //  --- Cek ada data yang sama di Tabel addItem
            if (existingIndex !== -1) {
                // -------------------------------------------------------------- sudah ada di addItem
                setAddItem((prevAddItem) => {
                    const ketAsal = 'existInTable';
                    const updatedAddItem = [...prevAddItem];
                    const addedData = updatedAddItem[existingIndex];
                    const updatedQTY = addedData.QTY + qtyToAdd;
                    const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, undefined, ketAsal);
                    const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                    const hargaDisc = funcCalculate.hargaDisc;
                    const subTotal = funcCalculate.subTotal;
                    updatedAddItem[existingIndex] = {
                        ...addedData,
                        QTY: funcCalculate.updatedQTY,
                        // QTY: updatedQTY,
                        SUBTOTAL: subTotal,
                        GRANDTOTAL: updatedGrandTotalDisc,
                        HARGADISCQTY: hargaDisc * updatedQTY,
                        HARGAPPN: funcCalculate.hargaPPN
                        // FAKTURTMP: funcCalculate.fakturTmp
                    };
                    return updatedAddItem;
                });
            } else {
                // -------------------------------------------------------------- BELUM ada di addItem
                const addedData = json[0];
                const ketAsal = 'firstEnter';
                const jsonWithDefaultQty = json.map((item) => ({ ...item, QTY: qtyToAdd }));
                const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, undefined, ketAsal);
                const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                const hargaDisc = funcCalculate.hargaDisc;
                const subTotal = funcCalculate.subTotal;
                // QTY: qtyToAdd
                setAddItem((prevAddItem) => [
                    ...prevAddItem,
                    { ...addedData, QTY: funcCalculate.updatedQTY, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, HARGADISCQTY: hargaDisc * qtyToAdd, HARGAPPN: funcCalculate.hargaPPN },
                    ...jsonWithDefaultQty.slice(1)
                ]);
            }
            const newDataRow = document.getElementById('new-data-row'); // Ganti dengan ID atau ref dari elemen yang menampilkan data baru dimasukkan
            if (newDataRow) {
                newDataRow.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Menggulirkan elemen baru ke tengah layar jika perlu
            }
            setBarcodeDialog(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Barang Tidak Ditemukan', life: 3000 });
            // Handle the error accordingly, e.g., show an error message
            setBarcodeDialog(false);
        }
    };

    const onRowSelectBarcode2 = async (event) => {
        const json = event.data;

        const selectedKode = json.KODE_TOKO;
        const enteredQty = event.qty || 1; // Default to 1 if no quantity provided
        if (!selectedKode) {
            setBarcodeDialog(false);
            return;
        }

        try {
            let sisaBarang = json.SISASTOCKBARANG;

            // Handle case where stock is "Unlimited"
            if (sisaBarang !== 'Unlimited') {
                sisaBarang = parseInt(sisaBarang, 10);
                if (sisaBarang <= 0) {
                    toast.current.show({
                        severity: 'error',
                        summary: 'Error Message',
                        detail: 'Stock Barang Sudah Habis',
                        life: 3000
                    });
                    setBarcodeDialog(false);
                    return;
                }
            }

            const valBarcode = json.KODE_TOKO;
            const existingIndex = addItem.findIndex((item) => item.BARCODE === valBarcode);
            const qtyToAdd = json.QTY || enteredQty;

            if (json.DISKONPERIODE !== 'ADA') {
                json.DISCOUNT = 0; // Set discount to 0 if period discount is not applicable
            }

            if (existingIndex !== -1) {
                // Update existing item
                setAddItem((prevAddItem) => {
                    const ketAsal = 'existInTable';
                    const updatedAddItem = [...prevAddItem];
                    const addedData = updatedAddItem[existingIndex];
                    const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, undefined, ketAsal);

                    updatedAddItem[existingIndex] = {
                        ...addedData,
                        QTY: funcCalculate.updatedQTY,
                        SUBTOTAL: funcCalculate.subTotal,
                        GRANDTOTAL: funcCalculate.updatedGrandTotalDisc,
                        HARGADISCQTY: funcCalculate.hargaDisc * funcCalculate.updatedQTY,
                        HARGAPPN: funcCalculate.hargaPPN
                    };

                    return updatedAddItem;
                });
            } else {
                // Add new item
                const addedData = { ...json, QTY: qtyToAdd };
                const ketAsal = 'firstEnter';
                const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, undefined, ketAsal);

                setAddItem((prevAddItem) => [
                    ...prevAddItem,
                    {
                        ...addedData,
                        QTY: funcCalculate.updatedQTY,
                        SUBTOTAL: funcCalculate.subTotal,
                        GRANDTOTAL: funcCalculate.updatedGrandTotalDisc,
                        HARGADISCQTY: funcCalculate.hargaDisc * funcCalculate.updatedQTY,
                        HARGAPPN: funcCalculate.hargaPPN
                    }
                ]);
            }

            // Scroll new data row into view if necessary
            const newDataRow = document.getElementById('new-data-row'); // Ganti dengan ID atau ref dari elemen yang menampilkan data baru dimasukkan
            if (newDataRow) {
                newDataRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            setBarcodeDialog(false);
        } catch (error) {
            console.error(error);
            toast.current.show({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Barang Tidak Ditemukan',
                life: 3000
            });
            setBarcodeDialog(false);
        }
    };

    const onRowSelectBarcode = async (event) => {
        const json = event.data;
        const selectedKode = json.KODE_TOKO;
        const enteredQty = 1; // Default to 1 if no quantity provided
        if (!selectedKode) {
            setBarcodeDialog(false);
            return;
        }

        try {
            let sisaBarang = json.SISASTOCKBARANG;

            // Handle case where stock is "Unlimited"
            if (sisaBarang === 'Habis') {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error Message',
                    detail: 'Stock Barang Sudah Habis',
                    life: 3000
                });
                setBarcodeDialog(false);
                return;
            }

            const valBarcode = json.KODE_TOKO;
            const existingIndex = addItem.findIndex((item) => item.KODE_TOKO === valBarcode);

            if (json.DISKONPERIODE !== 'ADA') {
                json.DISCOUNT = 0; // Set discount to 0 if period discount is not applicable
            }

            if (existingIndex !== -1) {
                // Update existing item
                setAddItem((prevAddItem) => {
                    const ketAsal = 'existInTable';
                    const updatedAddItem = [...prevAddItem];
                    const addedData = updatedAddItem[existingIndex];
                    // Perbarui QTY item yang ada
                    let newQty = addedData.QTY + enteredQty;
                    if (newQty > sisaBarang) {
                        toast.current.show({
                            severity: 'error',
                            summary: 'Error',
                            detail: `Qty tidak boleh lebih dari Sisa Stock (${parseInt(sisaBarang)})`,
                            life: 3000
                        });
                        newQty = parseInt(sisaBarang);
                    }
                    const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, enteredQty, undefined, undefined, ketAsal);

                    updatedAddItem[existingIndex] = {
                        ...addedData,
                        QTY: newQty,
                        SUBTOTAL: funcCalculate.subTotal,
                        GRANDTOTAL: funcCalculate.updatedGrandTotalDisc,
                        HARGADISCQTY: funcCalculate.hargaDisc * newQty,
                        HARGAPPN: funcCalculate.hargaPPN
                    };

                    return updatedAddItem;
                });
            } else {
                // Add new item
                const addedData = { ...json, QTY: enteredQty };
                const ketAsal = 'firstEnter';
                const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, enteredQty, undefined, undefined, ketAsal);

                setAddItem((prevAddItem) => [
                    ...prevAddItem,
                    {
                        ...addedData,
                        QTY: funcCalculate.updatedQTY,
                        SUBTOTAL: funcCalculate.subTotal,
                        GRANDTOTAL: funcCalculate.updatedGrandTotalDisc,
                        HARGADISCQTY: funcCalculate.hargaDisc * funcCalculate.updatedQTY,
                        HARGAPPN: funcCalculate.hargaPPN
                    }
                ]);
            }

            // Scroll new data row into view if necessary
            const newDataRow = document.getElementById('new-data-row'); // Ganti dengan ID atau ref dari elemen yang menampilkan data baru dimasukkan
            if (newDataRow) {
                newDataRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            setBarcodeDialog(false);
        } catch (error) {
            console.error(error);
            toast.current.show({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Barang Tidak Ditemukan',
                life: 3000
            });
            setBarcodeDialog(false);
        }
    };

    const onQtyUpdate = (updatedAddItem) => {
        setAddItem(updatedAddItem);
    };

    // ----------------------------------------------------------------------------< Search Barcode >
    const [globalFilter, setGlobalFilter] = useState('');
    const onFilterInput = (event) => {
        setGlobalFilter(event.target.value);
    };
    const clearFilter = () => {
        setGlobalFilter('');
    };
    const filterOptions = {
        global: { value: globalFilter, matchMode: 'contains' }
    };
    const headerHelperPopUp = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={onFilterInput} placeholder="Search..." style={{ marginBottom: '5px' }} />
                </span>
            </div>
        </div>
    );

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

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" />
                &nbsp;
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => inputChanged(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );

    const hideDialog = () => {
        setShiftDialog(false);
    };

    const [selectedType, setSelectedType] = useState('modeGambar');
    const handleDropdownChangeOld = (e) => {
        setSelectedType(e.value);
        //   setSelectedType(e.value && e.value.value);
    };
    const [loadingDropdown, setLoadingDropdown] = useState(false);
    const handleDropdownChange = (selectedOption) => {
        // Assuming the selected value is an object with a 'value' property
        const selectedValue = selectedOption.value;
        setSelectedType(selectedValue);
        setLoadingDropdown(true);
        btnProduk(null, false);
        // toggleBarcode(null, false);
        setTimeout(() => {
            setLoadingDropdown(false);
        }, 1000);
    };

    const [fakturTunda, setFakturTunda] = useState('');
    const handleRefresh = () => {
        setAddItem([]); // Mengosongkan tabel addItem
        setFakturTunda('');
    };

    // --------------------------------------------------< reprint >
    const [reprintDialog, setReprintDialog] = useState(false);
    const btnReprint = () => {
        setReprintDialog(true);
    };
    // --------------------------------------------------< retur >
    const [returDialog, setReturDialog] = useState(false);
    const btnRetur = () => {
        setReturDialog(true);
    };
    // --------------------------------------------------< Check Cetak Struk >
    const [isChecked, setIsChecked] = useState(true);
    const handleCheckboxChange = (e) => {
        setIsChecked(e.checked); // Mengubah status checkbox saat diubah
    };
    // --------------------------------------------------< daftarTunda >
    const [daftarTundaDialog, setDaftarTundaDialog] = useState(false);
    const [tundaDialog, setTundaDialog] = useState(false);
    const btnDaftarTunda = async () => {
        try {
            let requestBody = { KODESESI: selectedSesi.SESIJUAL };
            const vaData = await postData(apiEndPointGetDataFaktur, requestBody);
            const json = vaData.data;
            setDaftarTundaDialog(true);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    // ------------------------------------------------------------------------------------------------------------< TUNDA >
    const [noteDialog, setNoteDialog] = useState(false);
    const [catatan, setCatatan] = useState('');
    const handleSaveNote = () => {
        setNoteDialog(true);
        saveTunda();
        setNoteDialog(false);
        setTundaDialog(false);
    };

    const noteDialogFooter = (
        <>
            {/* <Button label="Batal" icon="pi pi-times" className="p-button-text" onClick={() => setNoteDialog(false)} /> */}
            <Button label="Simpan" icon="pi pi-check" className="p-button-text" onClick={handleSaveNote} />
        </>
    );
    const btnTunda = () => {
        if (!addItem || addItem.length === 0) {
            // Periksa jika addItem kosong
            toast.current.show({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Daftar Belanja Masih Kosong!',
                life: 3000
            });
            return;
        }
        setTundaDialog(true);
    };
    const createDataObject = (selectedSesi, addItem, catatan) => {
        try {
            // const total = addItem.reduce((accumulator, item) => accumulator + parseFloat(item.JUMLAH), 0);
            let total = 0;
            let allDiscount = 0;
            let allPpn = 0;
            let _data = {
                // FAKTUR dari sisi BE langsung
                KODESESI: selectedSesi.SESIJUAL,
                TGL: selectedSesi.TGL,
                USERNAME: selectedSesi.KASIR,
                detail_penjualan: addItem
                    .map((item) => {
                        // let jumlah = item.QTY * item.HJ;
                        let jumlah = item.GRANDTOTAL; // -----< GRANDTOTAL = Harga Total setelah diskon * qty >
                        total += jumlah;
                        let discount = item.HARGADISCQTY || 0;
                        allDiscount += discount;
                        let ppn = item.hargaPPN || 0;
                        allPpn += ppn;
                        return {
                            KODE: item.KODE,
                            // BARCODE: item.BARCODE,
                            NAMA: item.NAMA,
                            QTY: item.QTY,
                            SATUAN: item.SATUAN,
                            HARGA: item.HJ,
                            DISCOUNT: item.DISCOUNT,
                            HARGADISC: item.HARGADISCQTY,
                            PPN: item.hargaPPN || 0,
                            JUMLAH: jumlah,
                            KETERANGAN: 'item.KETERANGAN'
                        };
                    })
                    .filter((item) => item !== null),
                TOTAL: total,
                PAJAK: allPpn,
                DISCOUNT: allDiscount, // ----------< akumulasi dari DISCOUNT pada addItem
                CATATAN: catatan
            };
            return _data;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    };
    const apiEndPointStoreTunda = '/api/kasir_tmp/store';
    const saveTunda = async (event) => {
        let _data = createDataObject(selectedSesi, addItem, catatan);
        try {
            const vaTable = await postData(apiEndPointStoreTunda, _data);
            const json = vaTable.data;
            // return;
            toast.current.show({ severity: 'success', summary: json.message, detail: 'Tunda Transaksi Berhasil Tersimpan', life: 3000 });
            setTundaDialog(false);
            setAddItem([]);
        } catch (error) {
            const e = error?.response?.data || error;
            setTundaDialog(false);
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    const closingDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={() => setTundaDialog(false)} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={() => setNoteDialog(true)} />
        </>
    );

    const searchGridss = () => {
        return (
            <div className="formgrid grid">
                <div className="field col-12 mb-2 lg:col-4">
                    <div className="p-inputgroup">
                        <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" />
                    </div>
                </div>
                <div className="field col-12 mb-2 lg:col-8">
                    <div className="p-inputgroup">
                        {/* <span className="block mt-2 md:mt-0 p-input-icon-left"> */}
                        {/* <i className="pi pi-search" /> */}
                        <InputText type="search" onChange={(e) => inputChanged(e.target.value)} placeholder="Search..." />
                        {/* </span> */}
                    </div>
                </div>
            </div>
        );
    };
    const hideBarcode = () => {
        setlazyState((prevState) => ({
            ...prevState,
            filters: {}
        }));
        setBarcodeDialog(false);
    };
    const SearchGrid = searchGrid;

    // -----------------------------------------------------------------------------------------------------------------< Member >
    const [memberDialog, setMemberDialog] = useState(false);
    const [memberKode, setMemberKode] = useState('');
    const [memberNama, setMemberNama] = useState('');
    const btnMember = () => {
        setMemberDialog(true);
    };
    const handleMemberData = (memberKode, memberNama) => {
        setMemberKode(memberKode);
        setMemberNama(memberNama);
        // setProduk((prevProduk) => ({
        // 	...prevProduk,
        // 	SUPPLIER: memberKode,
        // }));
    };

    return (
        <div>
            <Toast ref={toast} />
            <Accordion activeIndex={-1}>
                <AccordionTab header="KASIR">
                    <div className="card p-4 grid grid-nogutter surface-card shadow-4 border-round" style={{ background: 'linear-gradient(135deg, #f8f9fa, #ffffff)' }}>
                        {/* Bagian Informasi (Tanggal, Supervisor, Kassa, Kasir) */}
                        <div className="col-12 sm:col-3 p-4" style={{ borderRight: '1px solid #e0e0e0' }}>
                            <div className="text-center mb-4">
                                <span className="block text-500 text-xl mb-2">Tanggal</span>
                                <div className="text-900 text-2xl font-bold">{selectedSesi?.TGL || '-'}</div>
                            </div>
                            <hr className="my-3" style={{ borderColor: '#e0e0e0' }} />
                            <div className="formgrid grid text-center">
                                <div className="field col-12 sm:col-4 mb-3">
                                    <span className="text-500 text-lg">Supervisor</span>
                                    <div className="text-900 text-sm font-medium">{fullName?.FULLNAME_SUPERVISOR || '-'}</div>
                                </div>
                                <div className="field col-12 sm:col-4 mb-3">
                                    <span className="text-500 text-lg">Kassa</span>
                                    <div className="text-900 text-sm font-medium">{selectedSesi?.KASSA || '-'}</div>
                                </div>
                                <div className="field col-12 sm:col-4 mb-3">
                                    <span className="text-500 text-lg">Kasir</span>
                                    <div className="text-900 text-sm font-medium">{fullName?.FULLNAME_KASIR || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Bagian Kasir dan Form */}
                        <div className="col-12 sm:col-9 p-4">
                            <div className="flex flex-column gap-2 align-items-center mb-3">
                                {/* <div className="w-full">
                                    <Dropdown value={selectedType} options={dropdownOptions} onChange={handleDropdownChange} placeholder="Pilih Mode" />
                                </div> */}
                                <div className="flex align-items-center w-full">
                                    <label htmlFor="struk" className="p-checkbox-label mr-2">
                                        Cetak Struk
                                    </label>
                                    <Checkbox id="struk" name="struk" checked={isChecked} onChange={handleCheckboxChange} />
                                </div>
                            </div>

                            <div className="p-inputgroup mb-4">
                                <span className="p-inputgroup-addon" style={{ background: '#e9ecef', border: 'none' }}>
                                    <i className="pi pi-qrcode" style={{ fontSize: '1.2rem', color: '#495057' }}></i>
                                </span>
                                <InputText id="barcode" autoFocus placeholder="Masukkan barcode..." onKeyDown={handleBarcodeKeyDown} />
                                {selectedType === 'modeTabel' && <Button icon="pi pi-search" className="p-button" onClick={() => btnProduk(null, true)} />}
                                {selectedType === 'modeGambar' && <Button label="Refresh" icon="pi pi-replay" className="p-button" onClick={handleRefresh} />}
                            </div>

                            <div className="formgrid grid">
                                <div className="field col-12 sm:col-6 md:col-3 mb-2">
                                    <Button icon="pi pi-ban" label="Tunda" className="p-button-outlined p-button-rounded" style={{ width: '100%' }} onClick={btnTunda} />
                                </div>
                                <div className="field col-12 sm:col-6 md:col-3 mb-2">
                                    <Button icon="pi pi-list" label="Daftar Tunda" className="p-button-outlined p-button-rounded" style={{ width: '100%' }} onClick={btnDaftarTunda} />
                                </div>
                                <div className="field col-12 sm:col-6 md:col-3 mb-2">
                                    <Button icon="pi pi-print" label="Reprint" className="p-button-outlined p-button-rounded" style={{ width: '100%' }} onClick={btnReprint} />
                                </div>
                                <div className="field col-12 sm:col-6 md:col-3 mb-2">
                                    <Button icon="pi pi-sync" label="Retur" className="p-button-outlined p-button-rounded" style={{ width: '100%' }} onClick={btnRetur} />
                                </div>
                            </div>
                        </div>
                    </div>
                </AccordionTab>
            </Accordion>

            <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProdukData={handleProdukData} />
            {/* -------------------------------------------------------------------------------------------------------------< BARCODE DIALOG > */}
            <Dialog visible={barcodeDialog} style={{ width: '700px' }} header="PRODUK" modal className="p-fluid" onHide={hideBarcode}>
                {loadingItem && <TabelSkaleton items={itemsSkelaton} kolom={columnsBarcode} />}
                {!loadingItem && (
                    <div>
                        {/* {header} */}
                        <DataTable
                            size="small"
                            value={barcodeTabel}
                            lazy
                            dataKey="KODE_TOKO"
                            globalFilter={globalFilter}
                            filter
                            filterOptions={filterOptions}
                            filterMode="match"
                            emptyMessage="Data Kosong"
                            className="datatable-responsive"
                            onRowSelect={onRowSelectBarcode}
                            selectionMode="single" // Memungkinkan pemilihan satu baris
                            frozenHeader={true}
                            header={header}
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="KODE_TOKO" header="KODE_TOKO"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="DISCOUNT" header="DISC %" body={(rowData) => (rowData.DISCOUNT === 0 ? '-' : rowData.DISCOUNT)} bodyStyle={{ textAlign: 'center' }}></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="HJ" bodyStyle={{ textAlign: 'right' }} body={(rowData) => formatRibuan(rowData.HJ)} header="HARGA"></Column>
                        </DataTable>
                    </div>
                )}
            </Dialog>
            {/* -----------------------------------------------------------------------------------------< DIALOG VALIDASI TUNDA > */}
            <Dialog visible={tundaDialog} header="Confirm" modal footer={closingDialogFooter} onHide={() => setTundaDialog(false)}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Yakin ingin Tunda Transaksi ?</span>
                </div>
            </Dialog>
            <Dialog visible={noteDialog} header="Catatan Tunda" modal footer={noteDialogFooter} onHide={() => setNoteDialog(false)}>
                <div className="flex align-items-center justify-content-center">
                    <div className="formgrid grid">
                        <div className="field col-12 mb-2 lg:col-12">
                            <label htmlFor="Catatan">Catatan</label>
                            <div className="p-inputgroup">
                                <InputText id="catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} required />
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
            <Member memberDialog={memberDialog} setMemberDialog={setMemberDialog} btnMember={btnMember} handleMemberData={handleMemberData} />
            {selectedType === 'modeTabel' ? (
                <DataBarangTabel selectedSesi={selectedSesi} dataShift={selectedSesi} addItem={addItem} setAddItem={setAddItem} onQtyUpdate={onQtyUpdate} calculateUpdatedGrandTotalDisc={calculateUpdatedGrandTotalDisc} isChecked={isChecked} />
            ) : selectedType === 'modeGambar' ? (
                <DataMenu
                    selectedSesi={selectedSesi}
                    dataShift={selectedSesi}
                    addItem={addItem}
                    setAddItem={setAddItem}
                    onQtyUpdate={onQtyUpdate}
                    calculateUpdatedGrandTotalDisc={calculateUpdatedGrandTotalDisc}
                    setBarcodeTabel={setBarcodeTabel}
                    barcodeTabel={barcodeTabel}
                    loadingDropdown={loadingDropdown}
                    onRowSelectBarcode={onRowSelectBarcode}
                    isChecked={isChecked}
                />
            ) : null}
            {/* <SesiJual shiftDialog={shiftDialog} hideDialog={hideDialog} onSesiSelect={handleSesiSelect} /> */}
            {/* <Retur returDialog={returDialog} setReturDialog={setReturDialog} selectedSesi={selectedSesi} btnRetur={btnRetur} /> */}
            {/* <Reprint reprintDialog={reprintDialog} setReprintDialog={setReprintDialog} selectedSesi={selectedSesi} btnReprint={btnReprint} /> */}
            {/* <Tunda fakturTunda={fakturTunda} setFakturTunda={setFakturTunda} daftarTundaDialog={daftarTundaDialog} setDaftarTundaDialog={setDaftarTundaDialog} selectedSesi={selectedSesi} btnReprint={btnDaftarTunda} addItem={addItem} setAddItem={setAddItem} calculateUpdatedGrandTotalDisc={calculateUpdatedGrandTotalDisc} /> */}

            {shiftDialog && <SesiJual shiftDialog={shiftDialog} hideDialog={hideDialog} onSesiSelect={handleSesiSelect} />}
            {returDialog && <Retur returDialog={returDialog} setReturDialog={setReturDialog} selectedSesi={selectedSesi} btnRetur={btnRetur} />}
            {reprintDialog && <Reprint reprintDialog={reprintDialog} setReprintDialog={setReprintDialog} selectedSesi={selectedSesi} btnReprint={btnReprint} />}
            {daftarTundaDialog && (
                <Tunda
                    fakturTunda={fakturTunda}
                    setFakturTunda={setFakturTunda}
                    daftarTundaDialog={daftarTundaDialog}
                    setDaftarTundaDialog={setDaftarTundaDialog}
                    selectedSesi={selectedSesi}
                    btnReprint={btnDaftarTunda}
                    addItem={addItem}
                    setAddItem={setAddItem}
                    calculateUpdatedGrandTotalDisc={calculateUpdatedGrandTotalDisc}
                />
            )}
        </div>
    );
}

// export default App;
