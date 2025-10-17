/**
     * Nama Program: GODONG POS - Pembelian - Penerimaan Barang
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 1 Maret 2024 (re-coding)
     * Versi: 1.1.0

    Catatan:
    - Versi 1.1.0 mencakup fungsionalitas Menu Penerimaan Barang
*/
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Calendar } from 'primereact/calendar';
import { useRouter } from 'next/router';
import { ColumnGroup } from 'primereact/columngroup';
import { Dropdown } from 'primereact/dropdown';
import { Row } from 'primereact/row';
import styles from '../../../../component/styles/dataTable.module.css';
import Gudang from '../../../component/gudang';
import FakturPo from '../../../component/fakturPo';
import Produk from '../../../component/produk';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import { formatDateSave, formatTglExpired, formatDate, formatRibuan, showError } from '../../../../component/GeneralFunction/GeneralFunction';
import React, { useEffect, useRef, useState } from 'react';
import Supplier from '../../../component/supplier';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/pembelian/penerimaan-barang');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};
export default function MasterData() {
    //hubungan dengan path api disini
    const apiEndPointGetFaktur = '/api/pembelian/get_faktur';
    const apiEndPointGetBarcode = '/api/produk/get-barcode';
    const apiEndPointUpdate = '/api/pembelian/update';
    const apiEndPointStore = '/api/pembelian/store';
    const apiEndPointGetDataEdit = '/api/pembelian/getdata_edit';

    const router = useRouter();
    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pembelian, setPembelian] = useState({
        pembayaran: 'K'
    });

    const [faktur, setFaktur] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
    const [barcodeDialog, setBarcodeDialog] = useState(false);
    const [addPembelian, setAddPembelian] = useState([]);

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

    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);

    useEffect(() => {
        const { status } = router.query;
        const FAKTUR = localStorage.getItem('FAKTUR');
        if (status === 'update') {
            setFaktur(FAKTUR);
            fetchDataForEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true); // Set state isUpdateMode to true
        } else {
            loadLazyData();
            setIsUpdateMode(false); // Set state isUpdateMode to false
        }
    }, [router.query]);

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    // -----------------------------------------------------------------------------------------------------------------< FAKTUR >
    const loadLazyData = async () => {
        // setLoading(true);
        try {
            let requestBody = {
                KODE: 'PB',
                LEN: 6
            };
            const vaTable = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaTable.data;
            setFaktur(json.data);
            setPembelian((prevPembelian) => ({
                ...prevPembelian,
                FAKTUR: json.data
            }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _data = { ...pembelian };
        _data[`${name}`] = val;
        setPembelian(_data);
        // setPembelian((prevPembelian) => ({
        //     ...prevPembelian,
        //     _data
        // }));
    };

    const [checked, setChecked] = useState('K');
    const handleRadioChange = (e) => {
        let _produk = { ...pembelian };
        _produk['pembayaran'] = e.value;
        setPembelian(_produk);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...pembelian };
        _data[`${name}`] = val;
        setPembelian(_data);
        // setPembelian((prevPembelian) => ({
        //     ...prevPembelian,
        //     _data
        // }));
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const convertUndefinedToNull = (obj) => {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertUndefinedToNull(obj[key]); // Memanggil fungsi rekursif jika nilai properti adalah objek
                } else if (obj[key] === undefined) {
                    obj[key] = null; // Mengubah nilai undefined menjadi null
                }
            }
        }
    };

    const createDataObject = (_pembelian, _addPembelian) => {
        const data = {
            faktur: faktur,
            po: _pembelian.po,
            fakturasli: _pembelian.fakturasli,
            tgl: isUpdateMode ? _pembelian.tgl : formatDateSave(_pembelian.tgl),
            tglpo: _pembelian.tglpo,
            tgldo: _pembelian.tgldo,
            jthtmp: _pembelian.jthtmp,
            pembayaran: _pembelian.pembayaran,
            gudang: _pembelian.gudang,
            supplier: _pembelian.supplier,
            discount: totDisc,
            discount2: _pembelian.pembulatan ?? 0,
            pajak: totPpn,
            subtotal: totSubTotal,
            total: totGrandTotal,
            keterangan: _pembelian.keterangan,
            tabelTransaksiPembelian: _addPembelian
                .map((item) => {
                    const terima = item.terima !== null ? item.terima : 0;
                    if (terima > 0) {
                        const valTerimaBarang = item.terimabarang + item.terima;
                        convertUndefinedToNull(item);
                        return {
                            barcode: item.barcode,
                            kode: item.kode,
                            qtypo: item.qtypo,
                            terimabarang: valTerimaBarang || 0,
                            terima: item.terima || 0,
                            harga: item.hb,
                            hj: item.hj,
                            satuan: item.satuan,
                            discount: item.discount || 0,
                            discount2: 0,
                            ppn: item.ppn || 0,
                            jumlah: item.grandtotal,
                            tglexp: item.tglexp
                        };
                    } else {
                        return null;
                    }
                })
                .filter((item) => item !== null)
        };
        convertUndefinedToNull(data);
        return data;
    };

    const saveData = async (e) => {
        e.preventDefault();
        let _pembelian = { ...pembelian };
        let _addPembelian = [...addPembelian];
        let _data = createDataObject(_pembelian, _addPembelian);

        if (_data.GUDANG === null || _data.GUDANG === '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang tidak boleh kosong', life: 3000 });
            return;
        }

        if (_data.PEMBAYARAN === null || _data.PEMBAYARAN === '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Pembayaran belum dipilih', life: 3000 });
            return;
        }

        if (_data.tabelTransaksiPembelian.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tidak ada barang yang dibeli!', life: 3000 });
            return;
        }

        return console.log(_data);

        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _data);
            const json = vaTable.data;
            toast.current.show({ severity: 'success', summary: json.message, detail: 'Data Berhasil Tersimpan', life: 3000 });
            router.push('/pembelian/penerimaan-barang');
            // if (json.code === '200') {
            // } else {
            //     toast.current.show({ severity: 'error', summary: json.message, detail: json.messageValidator, life: 3000 });
            // }
        } catch (error) {
            console.error(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // Barcode -----------------------------------------------------------------------------------------------------------
    const [timer, setTimer] = useState(null);
    const handleBarcodeKeyDown = async (event) => {
        clearTimeout(timer);
        const newTimer = setTimeout(async () => {
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

                const params = { data: { KODE_TOKO: enteredBarcodeValue, terima: enteredQty }, skipSelectBarcode: true };
                await onRowSelectBarcode(params);

                barcodeInput.value = '';
            }
        }, 100);
        setTimer(newTimer);
    };

    const calculateUpdatedGrandTotalDisc = (addedData, qtyToAdd, editedQty, editedDisc, ketAsal, editHargaBeli, editNominalDisc, editNominalPpn) => {
        let updatedQTY;
        let disc;
        let ppn;
        let hargaDisc;
        let totDiscQty;
        let totPpnQty;
        let hargaBeli;
        let hargaPpn;
        if (ketAsal == 'firstEnter') {
            // -------------------------------------> 1
            updatedQTY = qtyToAdd;
            totDiscQty = addedData.discount;
            totPpnQty = addedData.ppn;
            hargaBeli = addedData.hb;
        } else if (ketAsal == 'firstBonus') {
            // -------------------------------------> Bonus 1 dg Barcode yang sama dg dari faktur
            updatedQTY = qtyToAdd;
            totDiscQty = addedData.discount;
            totPpnQty = addedData.ppn;
            hargaBeli = addedData.hb;
        } else if (ketAsal == 'existInTable') {
            // -------------------------------------> QTY di Tabel + 1 (exist sebelumnya)
            updatedQTY = addedData.QTY + qtyToAdd;
            totDiscQty = addedData.discount;
            totPpnQty = addedData.ppn;
            hargaBeli = addedData.hb;
        } else if (ketAsal == 'editQTYFromTable') {
            // -------------------------------------> QTY sesuai edit in cell
            updatedQTY = editedQty;
            totDiscQty = addedData.discount;
            totPpnQty = addedData.ppn;
            hargaBeli = addedData.hb;
        } else if (ketAsal == 'editHargaBeliFromTable') {
            // -------------------------------------> HB sesuai edit in cell
            updatedQTY = addedData.terima;
            totDiscQty = addedData.discount;
            totPpnQty = addedData.ppn;
            hargaBeli = editHargaBeli;
        } else if (ketAsal == 'editDiscountFromTable') {
            // -------------------------------------> Disc di tabel - editDiscFromTable
            updatedQTY = addedData.terima;
            totDiscQty = editNominalDisc;
            totPpnQty = addedData.ppn;
            hargaBeli = addedData.hb;
        } else if (ketAsal == 'editPpnFromTable') {
            // -------------------------------------> Ppn di tabel - editPpnFromTable
            updatedQTY = addedData.terima;
            totDiscQty = addedData.discount;
            totPpnQty = editNominalPpn;
            hargaBeli = addedData.hb;
        } else if (ketAsal == 'dataEdit') {
            // -------------------------------------> Dari FakturPo
            updatedQTY = addedData.terima;
            totDiscQty = addedData.discount;
            totPpnQty = addedData.ppn;
            hargaBeli = addedData.hb;
        } else {
            // -------------------------------------> Dari FakturPo dataFakturPo
            updatedQTY = addedData.terima;
            totDiscQty = addedData.discount;
            totPpnQty = addedData.ppn;
            hargaBeli = addedData.hb;
        }
        const subtotal = updatedQTY * hargaBeli; // -------< Total SEBELUM Disc >
        const updatedGrandTotalDisc = subtotal - parseFloat(totDiscQty) + parseFloat(totPpnQty);

        return { updatedGrandTotalDisc, hargaDisc, subtotal, disc, updatedQTY, hargaPpn, ppn, totDiscQty, totPpnQty, hargaBeli };
    };

    const onRowSelectBarcode = async (event) => {
        const selectedKode = event.data.KODE_TOKO;
        if (!selectedKode) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Barang Tidak Ditemukan', life: 3000 });
            setBarcodeDialog(false);
            return;
        }

        try {
            const vaTable = await postData(apiEndPointGetBarcode, { Barcode: `%${selectedKode}%` });
            const json = vaTable.data.data;

            const valBarcode = json[0].BARCODE;
            const existingIndex = addPembelian.findIndex((item) => item.barcode === valBarcode);
            const qtyToAdd = event.data.terima || 1;
            const addedData = {
                bonus: true,
                kode: json[0].KODE,
                barcode: json[0].BARCODE,
                nama: json[0].NAMA,
                satuan: json[0].SATUAN,
                hb: json[0].HARGABELI,
                discount: json[0].DISCOUNT,
                ppn: json[0].PAJAK,
                hj: json[0].HJ,
                tglexp: json[0].TGLEXP
            };

            // Fungsi untuk menghitung data pembelian
            const calculatePembelianData = (data) => {
                // Jika barang adalah bonus, set nilai tertentu menjadi 0
                if (data.bonus) {
                    return {
                        ...data,
                        qtypo: 0,
                        terimabarang: 0,
                        grandtotal: 0,
                        subtotal: 0,
                        hb: 0, // Harga Beli di-set 0 untuk bonus
                        hj: 0 // Harga Jual di-set 0 untuk bonus
                    };
                }

                return {
                    ...data,
                    qtypo: 0,
                    terimabarang: 0,
                    grandtotal: 0,
                    subtotal: 0
                };
            };

            if (existingIndex !== -1) {
                // Jika sudah ada di tabel
                const updatedAddPembelian = [...addPembelian];

                // Mencari index item yang sesuai dengan barcode
                const array = updatedAddPembelian.map((item, index) => (item.barcode === valBarcode ? index : null)).filter((index) => index !== null);

                // Cek jika item bonus sudah ada di tabel dan tambahkan kuantitasnya
                if (updatedAddPembelian[updatedAddPembelian.length - 1]?.bonus) {
                    setAddPembelian((prevAddPembelian) => {
                        const updatedQty = updatedAddPembelian[array[array.length - 1]].terima + qtyToAdd;
                        updatedAddPembelian[array[array.length - 1]].terima = updatedQty;
                        return [...updatedAddPembelian];
                    });
                    return; // Menghentikan eksekusi lebih lanjut jika bonus sudah ada
                }

                // Menambahkan data baru ke tabel
                setAddPembelian((prevAddPembelian) => [...prevAddPembelian, calculatePembelianData({ ...addedData, terima: qtyToAdd }), ...json.slice(1).map((item) => ({ ...item, terima: qtyToAdd }))]);
            } else {
                // Jika belum ada di tabel
                setAddPembelian((prevAddPembelian) => [...prevAddPembelian, calculatePembelianData({ ...addedData, terima: qtyToAdd }), ...json.slice(1).map((item) => ({ ...item, terima: qtyToAdd }))]);
            }

            setBarcodeDialog(false);
        } catch (error) {
            console.log('Error fetching barcode data:', error);
            setBarcodeDialog(false);
        }
    };

    //   -------------------------------------------------------------------------------------------------------------- Edit in Row

    const isPositiveInteger = (value) => {
        const parsedValue = parseInt(value, 10);
        return Number.isInteger(parsedValue) && parsedValue > 0;
    };

    const onQtyUpdate = (updatedAddPembelian) => {
        setAddPembelian(updatedAddPembelian);
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;
        // --- Kondisi edit field TERIMA, melakukan perhitungan TERIMA * HARGA
        switch (field) {
            case 'terima':
                const editedQty = parseFloat(newValue);
                if (!isNaN(editedQty)) {
                    // Check if editedQty is a valid number
                    if (editedQty === 0 || editedQty === '') {
                        deleteSelectedRow(rowData);
                    } else {
                        // const updatedAddPembelian = addPembelian.map((item) => {
                        const updatedAddPembelian = addPembelian.map((item) => {
                            if (item.barcode === rowData.barcode && item.bonus === rowData.bonus) {
                                const addedData = rowData;
                                const ketAsal = 'editQTYFromTable';

                                const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, null, editedQty, undefined, ketAsal, null, null, null);
                                const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                                const subtotal = funcCalculate.subtotal;
                                const totDiscQty = funcCalculate.totDiscQty;
                                const totPpnQty = funcCalculate.totPpnQty;

                                const qty = addedData.qtypo;
                                const terimaBrg = addedData.terimabarang || 0;
                                const sisaQty = qty - terimaBrg;

                                if (!addedData.bonus && editedQty <= sisaQty) {
                                    return { ...item, terima: editedQty, subtotal, grandtotal: updatedGrandTotalDisc, discount: totDiscQty, ppn: totPpnQty };
                                }

                                if (addedData.bonus) {
                                    return { ...item, terima: editedQty, subtotal, grandtotal: updatedGrandTotalDisc, discount: totDiscQty, ppn: totPpnQty };
                                }

                                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Jumlah Terima Tidak Boleh Melebihi QTY PO', life: 3000 });
                                return item; // Kembalikan data asli jika validasi gagal
                            }
                            return item; // Kembalikan data asli jika kondisi tidak cocok
                        });
                        setAddPembelian(updatedAddPembelian);

                        // Call a function in index.js to handle the updated addPembelian
                        if (onQtyUpdate) {
                            onQtyUpdate(updatedAddPembelian);
                        }
                    }
                } else {
                    // Handle the case when newValue is not a valid number
                    console.log('Invalid input. Please enter a valid number for QTY.');
                }
                break;
            case 'hb':
                if (isPositiveInteger(newValue)) {
                    const editHargaBeli = parseFloat(newValue);
                    const updatedAddPembelian = addPembelian.map((item) => {
                        if (item.barcode === rowData.barcode && item.bonus === rowData.bonus) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.QTY;
                            const ketAsal = 'editHargaBeliFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, null, undefined, null, ketAsal, editHargaBeli, null, null);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const hargaDisc = funcCalculate.hargaDisc;
                            const subtotal = funcCalculate.subtotal;
                            const totDiscQty = funcCalculate.totDiscQty;
                            const totPpnQty = funcCalculate.totPpnQty;

                            return { ...item, subtotal: subtotal, hb: editHargaBeli, grandtotal: updatedGrandTotalDisc, discount: totDiscQty, ppn: totPpnQty };
                        } else {
                            return item;
                        }
                    });
                    setAddPembelian(updatedAddPembelian);

                    // Call a function in index.js to handle the updated addPembelian
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddPembelian);
                    }
                } else {
                    return item;
                }
                break;
            case 'discount':
                if (isPositiveInteger(newValue) || newValue === '0') {
                    const editDiscount = parseFloat(newValue);
                    const updatedAddPembelian = addPembelian.map((item) => {
                        if (item.barcode === rowData.barcode && item.bonus === rowData.bonus) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.terima;
                            const ketAsal = 'editDiscountFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, null, ketAsal, null, editDiscount, null);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const hargaDisc = funcCalculate.hargaDisc;
                            const subtotal = funcCalculate.subtotal;
                            const totDiscQty = funcCalculate.totDiscQty;
                            const totPpnQty = funcCalculate.totPpnQty;

                            return { ...item, subtotal: subtotal, grandtotal: updatedGrandTotalDisc, discount: editDiscount, ppn: totPpnQty };
                        } else {
                            return item;
                        }
                    });
                    setAddPembelian(updatedAddPembelian);

                    // Call a function in index.js to handle the updated addPembelian
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddPembelian);
                    }
                }
                break;
            case 'ppn':
                if (isPositiveInteger(newValue) || newValue === '0') {
                    const editPpn = parseFloat(newValue);
                    const updatedAddPembelian = addPembelian.map((item) => {
                        if (item.barcode === rowData.barcode && item.bonus === rowData.bonus) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.QTY;
                            const ketAsal = 'editPpnFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, null, ketAsal, null, null, editPpn);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const hargaDisc = funcCalculate.hargaDisc;
                            const subtotal = funcCalculate.subtotal;
                            const totDiscQty = funcCalculate.totDiscQty;
                            const totPpnQty = funcCalculate.totPpnQty;

                            return { ...item, subtotal: subtotal, grandtotal: updatedGrandTotalDisc, discount: totDiscQty, ppn: editPpn };
                        } else {
                            return item;
                        }
                    });
                    setAddPembelian(updatedAddPembelian);

                    // Call a function in index.js to handle the updated addPembelian
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddPembelian);
                    }
                } else {
                    return item;
                }
                break;
            case 'tglexp':
                const existingIndex = addPembelian.findIndex((item) => item.barcode === rowData.barcode && item.bonus === rowData.bonus);
                if (existingIndex !== -1) {
                    const updatedAddPembelian = [...addPembelian];
                    updatedAddPembelian[existingIndex] = {
                        ...updatedAddPembelian[existingIndex],
                        tglexp: newValue
                    };
                    setAddPembelian(updatedAddPembelian);
                }
                break;
            case 'hj':
                const existingIndex2 = addPembelian.findIndex((item) => item.barcode === rowData.barcode && item.bonus === rowData.bonus);
                if (existingIndex2 !== -1) {
                    const updatedAddPembelian = [...addPembelian];
                    updatedAddPembelian[existingIndex2] = {
                        ...updatedAddPembelian[existingIndex2],
                        hj: newValue
                    };
                    setAddPembelian(updatedAddPembelian);
                }
                break;
            default:
                event.preventDefault();
                break;
        }
    };
    // ------------------------------------------------------------------------------------------------------------------------- calculate
    const cellEditor = (options) => {
        return textEditor(options);
    };

    const textEditor = (options) => {
        return <InputText type="number" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    // -----------------------------------------------------------------------------------------------------------------< Gudang >
    const [gudangDialog, setGudangDialog] = useState(false);
    const btnGudang = () => {
        setGudangDialog(true);
    };
    const handleGudangData = (gudangKode, gudangKet) => {
        setPembelian((prevPembelian) => ({
            ...prevPembelian,
            gudang: gudangKode,
            ketgudang: gudangKet
        }));
    };
    // -----------------------------------------------------------------------------------------------------------------< FakturPo >
    const [fakturPoDialog, setFakturPoDialog] = useState(false);
    const btnFakturPo = () => {
        setFakturPoDialog(true);
    };

    const handleFakturPoData = (dataPO) => {
        setPembelian((prevPembelian) => ({
            ...prevPembelian,
            po: dataPO.faktur,
            fakturasli: dataPO.fakturasli,
            tglpo: dataPO.tgl,
            tgldo: dataPO.tgldelivery,
            jthtmp: dataPO.jthtmp,
            supplier: dataPO.supplier,
            nama: dataPO.nama,
            alamat: dataPO.alamat
        }));
        setAddPembelian(dataPO.detail);
    };
    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const [produkFaktur, setProdukFaktur] = useState('');
    const btnProduk = () => {
        setProdukDialog(true);
    };
    const handleProdukData = (produkFaktur) => {
        setProdukFaktur(produkFaktur);
        onRowSelectBarcode({ data: produkFaktur });
    };

    // ---------------------------------------------------------------------------------------------------------------- Button
    const rightFooterTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    {/* <Button label="Clear" className="p-button-danger p-button mr-2"/> */}
                    <Button label="Save" className="p-button-primary p-button mr-2" onClick={saveData} />
                    <Button
                        label="Cancel"
                        className="p-button-secondary p-button"
                        onClick={() => {
                            router.push('/pembelian/penerimaan-barang');
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    const totQty = addPembelian.reduce((accumulator, item) => accumulator + parseFloat(item.qtypo), 0);
    const totDiterima = addPembelian.reduce((accumulator, item) => {
        const returValue = parseFloat(item.terimabarang);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totTerima = addPembelian.reduce((accumulator, item) => {
        const returValue = parseFloat(item.terima);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totSubTotal = addPembelian.reduce((accumulator, item) => {
        const returValue = parseFloat(item.subtotal);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totDisc = addPembelian.reduce((accumulator, item) => accumulator + parseFloat(item.discount), 0);
    const totPpn = addPembelian.reduce((accumulator, item) => accumulator + parseFloat(item.ppn), 0);
    const totGrandTotal = addPembelian.reduce((accumulator, item) => {
        const returValue = parseFloat(item.grandtotal);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={2} footerStyle={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={totQty.toString()} footerStyle={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={totDiterima.toString()} footerStyle={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={totTerima.toString()} footerStyle={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={3} footer={`${totSubTotal.toLocaleString()}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totDisc.toLocaleString()}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totPpn.toLocaleString()}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totGrandTotal.toLocaleString()}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={3} />
            </Row>
        </ColumnGroup>
    );

    const deleteSelectedRow = (rowData) => {
        const updatedAddPembelian = addPembelian.filter((row) => row !== rowData);
        setAddPembelian(updatedAddPembelian);
    };

    const actionBodyTabel = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />
            </>
        );
    };
    // ----------------------------------------------------------------------------------------------------------------------------------------------------- search
    const dropdownValues = [
        { name: 'FAKTUR', label: 'FAKTUR' },
        { name: 'SUPPLIER', label: 'SUPPLIER' }
    ];
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center" style={{ marginBottom: '15px' }}>
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih kolom" />
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => onSearch(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );
    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.name != null) {
            _lazyState['filters'][defaultOption.name] = value;
        }
        onPage(_lazyState);
    };

    const fetchDataForEdit = async () => {
        const FAKTUR = localStorage.getItem('FAKTUR');
        setLoading(true);
        try {
            let requestBody = {
                faktur: FAKTUR
            };

            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;

            setPembelian(json);
            const addPembelian = json.tabelTransaksiPembelian;
            let _data = [...addPembelian];
            if (_data && Array.isArray(_data)) {
                const funcCalculateArray = [];
                for (let i = 0; i < _data.length; i++) {
                    const data = _data[i];
                    const ketAsal = 'dataEdit';
                    if (data.jumlah === 0) {
                        funcCalculateArray.push({
                            subtotal: 0,
                            totDiscQty: 0,
                            totPpnQty: 0,
                            updatedGrandTotalDisc: 0
                        });
                    } else {
                        const funcCalculate = await calculateUpdatedGrandTotalDisc(data, null, null, null, ketAsal);
                        funcCalculateArray.push(funcCalculate);
                    }
                }
                setAddPembelian(() => {
                    const updatedAddItem = _data.map((data, index) => {
                        const funcCalc = funcCalculateArray[index];
                        return {
                            kode: data.kode,
                            barcode: data.barcode,
                            nama: data.nama,
                            qtypo: data.qtypo,
                            terimabarang: data.terimabarang,
                            terima: data.terima,
                            discount: data.discount,
                            ppn: data.ppn,
                            satuan: data.satuan,
                            hb: data.hb,
                            hj: data.hj,
                            tglexp: data.tglexp,
                            subtotal: data.jumlah === 0 ? 0 : funcCalc.subtotal,
                            grandtotal: data.jumlah === 0 ? 0 : funcCalc.updatedGrandTotalDisc
                        };
                    });
                    return updatedAddItem;
                });
            } else {
                setAddPembelian([]);
            }
        } catch (error) {
            console.log('Error fetching data:', error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------------------------------------------------------------------------------------------< Supplier >
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [supplierKode, setSupplierKode] = useState('');
    const [supplierNama, setSupplierNama] = useState('');
    const [supplierAlamat, setSupplierAlamat] = useState('');
    const btnSupplier = () => {
        setSupplierDialog(true);
    };
    const handleSupplierData = (supplierKode, supplierNama, supplierAlamat) => {
        setPembelian((p) => ({
            ...p,
            supplier: supplierKode,
            nama: supplierNama,
            alamat: supplierAlamat
        }));
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>{isUpdateMode ? 'Edit' : 'Add'} Pembelian / Penerimaan Barang</h4>
                    <hr></hr>
                    <Toast ref={toast} />
                    <div>
                        <div className="formgrid grid">
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="faktur">Faktur</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={faktur} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="fakturasli">Faktur Asli</label>
                                <div className="p-inputgroup">
                                    <InputText value={pembelian.fakturasli} onChange={(e) => onInputChange(e, 'fakturasli')} required />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="fakturasli">Keterangan</label>
                                <div className="p-inputgroup">
                                    <InputText value={pembelian.keterangan} onChange={(e) => onInputChange(e, 'keterangan')} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-3">
                                <label htmlFor="tanggal">Tanggal Faktur</label>
                                <div className="p-inputgroup">
                                    <Calendar id="tgl" value={pembelian.tgl ? new Date(pembelian.tgl) : new Date()} onChange={(e) => onInputChange(e, 'TGL')} showIcon dateFormat="dd-mm-yy" />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-3">
                                <label htmlFor="tanggal">Tanggal PO</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="jatuhtempo" value={formatDate(pembelian.tglpo || new Date())} showIcon />
                                    <Button icon="pi pi-calendar" className="p-button" />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-3">
                                <label htmlFor="tanggal">Tanggal DO</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="tgl" value={formatDate(pembelian.tgldo || new Date())} showIcon dateFormat="dd-mm-yy" />
                                    <Button icon="pi pi-calendar" className="p-button" />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-3">
                                <label htmlFor="tanggal">Jatuh Tempo</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="jatuhtempo" value={formatDate(pembelian.jthtmp || new Date())} showIcon dateFormat="dd-mm-yy" />
                                    <Button icon="pi pi-calendar" className="p-button" />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="supplier">Supplier</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={pembelian.supplier} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} disabled={readOnlyEdit} />
                                    <InputText readOnly value={pembelian.nama} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="kota">Alamat</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={pembelian.alamat} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="">Gudang</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={pembelian.gudang} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnGudang} disabled={readOnlyEdit} />
                                    <InputText readOnly value={pembelian.ketgudang} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-4">
                                <label htmlFor="discount">Discount</label>
                                <div className="p-inputgroup">
                                    <Button className="p-button" readOnly>
                                        <span>Rp</span>
                                    </Button>
                                    <InputNumber value={pembelian.pembulatan} inputStyle={{ textAlign: 'right' }} onChange={(e) => onInputNumberChange(e, 'pembulatan')}></InputNumber>
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-3">
                                <label htmlFor="Pembayaran" style={{ marginBottom: '10px' }}>
                                    Pembayaran
                                </label>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <div className="p-inputgroup">
                                            <RadioButton inputId="kredit" name="pembayaran" value="K" onChange={handleRadioChange} style={{ marginRight: '5px' }} checked={pembelian.pembayaran === 'K'} />
                                            <label htmlFor="kredit">Kredit</label>
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <div className="p-inputgroup">
                                            <RadioButton inputId="tunai" name="pembayaran" value="T" onChange={handleRadioChange} style={{ marginRight: '5px' }} checked={pembelian.pembayaran === 'T'} />
                                            <label htmlFor="tunai">Tunai</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-5">
                                <label htmlFor="supplier">Barcode</label>
                                <div className="p-inputgroup">
                                    <InputText id="barcode" onKeyDown={handleBarcodeKeyDown} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnProduk} />
                                </div>
                            </div>
                            {/* </div> */}
                        </div>
                    </div>
                    <hr></hr>
                    {/* value={bayarFakturTabel.filter(row => statusFilter === 'B' ? row.PEMBAYARAN !== 0 : row.PEMBAYARAN === 0)} // Filter data sesuai status filter */}
                    <div className={styles.datatableContainer}>
                        <DataTable
                            value={addPembelian}
                            lazy
                            dataKey="kode"
                            className="datatable-responsive"
                            first={lazyState.first}
                            totalRecords={totalRecords}
                            onPage={onPage}
                            loading={loading}
                            footerColumnGroup={footerGroup}
                            size="small"
                            scrollable
                            scrollHeight="200px"
                            frozenFooter
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="barcode" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="nama" header="NAMA"></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="qtypo"
                                header="QTY PO"
                                body={(rowData) => {
                                    const value = rowData.qtypo ? parseInt(rowData.qtypo).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'center' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="terimabarang"
                                header="TERIMA BRG"
                                body={(rowData) => {
                                    const value = rowData.terimabarang ? parseInt(rowData.terimabarang).toLocaleString() : '0';
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'center' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="terima"
                                header="TERIMA"
                                editor={(options) => cellEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => {
                                    const value = rowData.terima ? parseInt(rowData.terima).toLocaleString() : '0';
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'center' }}
                            ></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="satuan" header="SATUAN" bodyStyle={{ textAlign: 'center' }}></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="hb"
                                header="HARGA BELI"
                                body={(rowData) => {
                                    const value = rowData.hb ? parseInt(rowData.hb).toLocaleString() : 0;
                                    return value;
                                }}
                                // editor={(options) => textEditor(options)}
                                editor={(options) => {
                                    if (options.rowData.bonus) {
                                        return parseInt(options.rowData.hb).toLocaleString();
                                    }
                                    return textEditor(options);
                                }}
                                onCellEditComplete={(e) => {
                                    if (e.rowData && e.rowData.bonus) {
                                        return;
                                    }
                                    onCellEditComplete(e);
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="subtotal"
                                header="SUBTOTAL"
                                body={(rowData) => {
                                    const value = rowData.subtotal ? parseInt(rowData.subtotal).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="discount"
                                header="DISCOUNT"
                                editor={(options) => {
                                    if (options.rowData.bonus) {
                                        return parseInt(options.rowData.discount).toLocaleString();
                                    }
                                    return textEditor(options);
                                }}
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => formatRibuan(rowData.discount)}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="ppn"
                                header="PPN"
                                editor={(options) => {
                                    if (options.rowData.bonus) {
                                        return parseInt(options.rowData.ppn).toLocaleString();
                                    }
                                    return textEditor(options);
                                }}
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => {
                                    const value = rowData.ppn ? parseInt(rowData.ppn).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="grandtotal"
                                header="GRAND TOTAL"
                                body={(rowData) => {
                                    const value = rowData.grandtotal ? parseInt(rowData.grandtotal).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="hj"
                                header="HARGA JUAL"
                                body={(rowData) => {
                                    const value = rowData.hj ? parseInt(rowData.hj).toLocaleString() : 0;
                                    return value;
                                }}
                                // editor={(options) => textEditor(options)}
                                editor={(options) => {
                                    if (options.rowData.bonus) {
                                        return parseInt(options.rowData.hj).toLocaleString();
                                    } else {
                                        return textEditor(options);
                                    }
                                }}
                                onCellEditComplete={onCellEditComplete}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="tglexp" header="EXPIRED" body={(rowData) => formatTglExpired(rowData.tglexp)}></Column>
                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTabel} bodyStyle={{ textAlign: 'center' }}></Column>
                        </DataTable>
                        <br></br>
                    </div>
                    <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>

                    <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
                    <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={btnGudang} handleGudangData={handleGudangData} />
                    <FakturPo fakturPoDialog={fakturPoDialog} setFakturPoDialog={setFakturPoDialog} btnFakturPo={btnFakturPo} handleFakturPoData={handleFakturPoData} />
                    <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProdukData={handleProdukData} />
                </div>
            </div>
        </div>
    );
}
